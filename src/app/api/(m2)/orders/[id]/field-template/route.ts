import { authorize } from "@/lib/platform/data/access";
import { orderLines, orderSampleStore } from "@/lib/modules/m2/data/orders";
import { resultMatrix } from "@/lib/modules/m2/orders";
import { csvRow } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** File mẫu "Nhập dữ liệu hiện trường": mỗi dòng một mẫu của đơn, mỗi cột một chỉ tiêu hiện trường (đã có giá trị thì điền sẵn). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const [lines, samples] = await Promise.all([orderLines(id), orderSampleStore.list()]);
  const loc = new Map(samples.filter((s) => s.orderId === id).map((s) => [s.code, s]));
  const field = lines
    .filter((l) => l.lineKind === "Hiện trường")
    .map((l) => ({ ...l, locationName: loc.get(l.sampleCode)?.locationName ?? "", customerSampleCode: loc.get(l.sampleCode)?.customerSampleCode ?? "" }));
  const m = resultMatrix(field);
  const csv = [
    csvRow(["#", "Mã mẫu", "Vị trí lấy mẫu", ...m.columns.map((c) => (c.unit ? `${c.criterion} (${c.unit})` : c.criterion))]),
    ...m.rows.map((r, i) => csvRow([i + 1, r.code, r.locationName, ...r.cells])),
  ].join("\r\n");
  return new Response(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="du-lieu-hien-truong.csv"` } });
}
