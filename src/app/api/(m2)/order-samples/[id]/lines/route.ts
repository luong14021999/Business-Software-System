import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderSampleStore, orderStore } from "@/lib/modules/m2/data/orders";
import { initialApprovals, insertResult, nextResultCode } from "@/lib/modules/m2/data/results";
import { LINE_KINDS } from "@/lib/modules/m2/orders";
import { withAccessories } from "@/lib/modules/m2/data/accessories";
import { dbQuery } from "@/lib/platform/db";
import { normalizeVi } from "@/lib/platform/format";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

type Item = { name: string; unit?: string; method?: string; subcontractor?: string; samplingTimes?: number; lineKind?: string };

const sampleOf = async (id: string) => (await orderSampleStore.list()).find((x) => x.id === id);

/** Danh sách chỉ tiêu ghi kèm trên mẫu (cột criteria) theo đúng các dòng kết quả hiện có. */
async function syncCriteria(code: string) {
  await dbQuery(
    `update public.samples set criteria = coalesce((select jsonb_agg(criterion order by coalesce(sort, 0), criterion) from public.analysis_results where sample_code = $1), '[]'::jsonb) where code = $1`,
    [code],
  );
}

/** Thêm chỉ tiêu vào một yêu cầu (mẫu) đã bóc tách; bỏ qua chỉ tiêu đã có. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const s = await sampleOf(id);
  if (!s) return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  if (s.stage === "Hủy mẫu" || s.stage === "Trả kết quả") return NextResponse.json({ error: `Yêu cầu đang ở trạng thái "${s.stage}"` }, { status: 409 });
  const { items: picked = [] } = (await req.json()) as { items?: Item[] };
  const items: Item[] = await withAccessories(picked, s.sampleTypeId);
  const existing = await dbQuery(`select criterion, coalesce(max(sort) over (), 0) mx from public.analysis_results where sample_code = $1`, [s.code]);
  const have = new Set(existing.map((r) => normalizeVi(r.criterion as string)));
  let sort = Number(existing[0]?.mx ?? 0);
  const order = s.orderId ? (await orderStore.list()).find((o) => o.id === s.orderId) : undefined;
  const added: string[] = [];
  for (const it of items) {
    const name = String(it.name ?? "").trim();
    if (!name || have.has(normalizeVi(name))) continue;
    have.add(normalizeVi(name));
    await insertResult({
      result_code: await nextResultCode(todayISO().slice(0, 4)),
      sample_code: s.code,
      customer_name: s.customer,
      matrix: s.type,
      criterion: name,
      unit: it.unit ?? "",
      method: it.method ?? "",
      subcontractor: it.subcontractor ?? "",
      sort: ++sort,
      sampling_times: Math.min(20, Math.max(1, Math.round(Number(it.samplingTimes) || 1))),
      line_kind: (LINE_KINDS as readonly string[]).includes(it.lineKind ?? "") ? it.lineKind : "Phòng TN",
      status: "Đang nhập",
      approvals: initialApprovals(),
      replicates: [],
      raw_files: [],
      conclusion: "Báo cáo giá trị",
    });
    added.push(name);
  }
  if (!added.length) return NextResponse.json({ error: "Chỉ tiêu đã có trong yêu cầu hoặc chưa chọn chỉ tiêu" }, { status: 400 });
  await syncCriteria(s.code);
  await logChange({ entity: "order-samples", entityId: s.id, action: "Thêm chỉ tiêu", label: `${s.code}${order ? ` · đơn ${order.code}` : ""}`, changes: [{ field: "chỉ tiêu", old: "", new: added.join(", ") }] });
  return NextResponse.json({ ok: true, added: added.length }, { status: 201 });
}

/** Bớt chỉ tiêu: chỉ xóa được dòng chưa có kết quả và chưa nộp duyệt. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const s = await sampleOf(id);
  if (!s) return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  const lineId = new URL(req.url).searchParams.get("lineId") ?? "";
  const [line] = await dbQuery(`select id, criterion, status, mean, result_prefix from public.analysis_results where id = $1 and sample_code = $2`, [lineId, s.code]).catch(() => []);
  if (!line) return NextResponse.json({ error: "Không tìm thấy chỉ tiêu" }, { status: 404 });
  if (line.status !== "Đang nhập" || line.mean !== null || line.result_prefix) {
    return NextResponse.json({ error: `"${line.criterion}" đã có kết quả hoặc đang duyệt – không bớt được` }, { status: 409 });
  }
  await dbQuery(`delete from public.analysis_results where id = $1`, [lineId]);
  await syncCriteria(s.code);
  await logChange({ entity: "order-samples", entityId: s.id, action: "Bớt chỉ tiêu", label: s.code, changes: [{ field: "chỉ tiêu", old: line.criterion as string, new: "" }] });
  return NextResponse.json({ ok: true });
}
