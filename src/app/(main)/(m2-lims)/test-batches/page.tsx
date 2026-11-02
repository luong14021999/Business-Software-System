import { XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { btn } from "@/components/m2/lab-ui/page";
import { BatchRowMenu } from "@/components/m2/batches/batch-ui";
import { batchLines, testBatchStore } from "@/lib/modules/m2/data/orders";
import { BATCH_STATUSES } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateTimeVN } from "@/lib/platform/dates";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

const TONE: Record<string, string> = { "Phân tích": "text-[#ff4500]", Duyệt: "text-[#337ab7]", "Trả kết quả": "text-[#008000]" };

/** Danh sách mẻ thử nghiệm như XaLab. */
export default async function TestBatchesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const [batches, access] = await Promise.all([testBatchStore.list(), currentAccess()]);
  const canWrite = access.can("results.enter");
  const q = normalizeVi(sp.q ?? "");
  // Tìm theo mã mẻ, phương pháp, người phân tích hoặc mã mẫu trong mẻ.
  const codesOf = q ? new Map(await Promise.all(batches.map(async (b) => [b.id, (await batchLines(b.id)).map((l) => l.sampleCode).join(" ")] as const))) : new Map<string, string>();
  const rows = batches
    .filter((b) => !sp.status || b.status === sp.status)
    .filter((b) => !q || normalizeVi(`${b.code} ${b.method} ${b.analyst} ${codesOf.get(b.id) ?? ""}`).includes(q))
    .sort((a, b) => b.code.localeCompare(a.code));
  const { page, pages, slice } = paginate(rows, sp);
  const url = (status?: string) => `/test-batches${status ? `?status=${encodeURIComponent(status)}` : ""}`;
  return (
    <XListPage
      title="Danh sách mẻ thử nghiệm"
      basePath="/test-batches"
      sp={sp}
      newHref={canWrite ? "/test-batches/new" : undefined}
      statusFilter={false}
      extraFilters={<Dropdown filter className={`${btn} ${canWrite ? "-ml-px rounded-l-none" : ""}`} label={`Trạng thái: ${sp.status || "Tất cả"}`} items={[{ label: "Tất cả", href: url(), active: !sp.status }, ...BATCH_STATUSES.map((s) => ({ label: s, href: url(s), active: sp.status === s }))]} />}
      searchPlaceholder="Mã mẻ, mã mẫu, phương pháp"
      headers={["Mã", "Phương pháp", "Người phân tích", "Ngày bắt đầu", "Ngày kết thúc", "Trạng thái"]}
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((b, i) => ({
        id: b.id,
        no: i + 1,
        href: `/test-batches/${b.id}/edit`,
        cells: [b.code, b.method, b.analyst, fmtDateTimeVN(b.startedAt), fmtDateTimeVN(b.finishedAt), <span key="s" className={TONE[b.status] ?? ""}>{b.status}</span>],
        actions: <BatchRowMenu id={b.id} code={b.code} canWrite={canWrite} />,
      }))}
    />
  );
}
