import { authorize } from "@/lib/platform/data/access";
import { batchLines, orderSampleStore } from "@/lib/modules/m2/data/orders";
import { resultMatrix } from "@/lib/modules/m2/orders";
import { csvRow } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** File mẫu nhập kết quả của mẻ: mỗi dòng một mẫu, mỗi cột một chỉ tiêu trong mẻ (đã có giá trị thì điền sẵn). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const [lines, samples] = await Promise.all([batchLines(id), orderSampleStore.list()]);
  const loc = new Map(samples.map((s) => [s.code, s]));
  const m = resultMatrix(lines.map((l) => ({ ...l, locationName: loc.get(l.sampleCode)?.locationName ?? "", customerSampleCode: loc.get(l.sampleCode)?.customerSampleCode ?? "" })));
  const csv = [
    csvRow(["#", "Mã mẫu", "Vị trí lấy mẫu", ...m.columns.map((c) => (c.unit ? `${c.criterion} (${c.unit})` : c.criterion))]),
    ...m.rows.map((r, i) => csvRow([i + 1, r.code, r.locationName, ...r.cells])),
  ].join("\r\n");
  return new Response(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ket-qua-me.csv"` } });
}
