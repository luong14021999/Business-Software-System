import { Search } from "lucide-react";
import { LabPage, Pager, btn, input } from "@/components/m2/lab-ui/page";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { RequestsTable, type RequestRow } from "@/components/m2/orders/requests-table";
import { orderSampleStore, testBatchStore } from "@/lib/modules/m2/data/orders";
import { SAMPLE_STAGES } from "@/lib/modules/m2/orders";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;
type SP = { q?: string; stage?: string; page?: string };

/** Quản lý yêu cầu: mọi yêu cầu (mẫu) thuộc đơn hàng, mới nhất trước. */
export default async function RequestsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const stage = sp.stage ?? "";
  const [samples, batches, lineBatches] = await Promise.all([
    orderSampleStore.list(),
    testBatchStore.list(),
    isDbConfigured()
      ? dbQuery(`select distinct sample_code, batch_id from public.analysis_results where batch_id is not null`).catch(() => [])
      : Promise.resolve([]),
  ]);
  const batchCode = new Map(batches.map((b) => [b.id, b.code]));
  const batchesOf = new Map<string, string[]>();
  for (const r of lineBatches) {
    const code = batchCode.get(r.batch_id as string);
    if (code) batchesOf.set(r.sample_code as string, [...(batchesOf.get(r.sample_code as string) ?? []), code]);
  }
  const q = normalizeVi(sp.q ?? "");
  const mine = samples.filter((s) => s.orderId);
  // Số thứ tự cố định theo thời điểm tạo (như mã số của XaLab): yêu cầu cũ nhất = 1.
  const no = new Map(
    [...mine].sort((a, b) => a.code.localeCompare(b.code)).map((s, i) => [s.id, i + 1]),
  );
  const rows: RequestRow[] = mine
    .filter((s) => !stage || s.stage === stage)
    .filter((s) => !q || normalizeVi(`${s.code} ${s.customer} ${s.locationName} ${s.customerSampleCode}`).includes(q))
    .sort((a, b) => (no.get(b.id) ?? 0) - (no.get(a.id) ?? 0))
    .map((s) => ({ id: s.id, no: no.get(s.id) ?? 0, code: s.code, orderId: s.orderId, customer: s.customer, locationName: s.locationName, batches: [...new Set(batchesOf.get(s.code) ?? [])].join(", "), stage: s.stage }));
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const url = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, page: undefined, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/requests${p.size ? `?${p}` : ""}`;
  };
  return (
    <LabPage
      title="Quản lý yêu cầu"
      toolbar={
        <>
          <Dropdown
            className={btn}
            label={`Trạng thái: ${stage || "Tất cả"}`}
            filter
            items={[{ label: "Tất cả", href: url({ stage: undefined }), active: !stage }, ...SAMPLE_STAGES.map((s) => ({ label: s, href: url({ stage: s }), active: stage === s }))]}
          />
          <form action="/requests" className="flex">
            {stage && <input type="hidden" name="stage" value={stage} />}
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Từ khóa tìm kiếm..." className={`${input} w-44 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4" /></button>
          </form>
        </>
      }
    >
      <RequestsTable rows={rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)} />
      <Pager page={page} pages={pages} href={(p) => `${url({})}${url({}).includes("?") ? "&" : "?"}page=${p}`} />
    </LabPage>
  );
}
