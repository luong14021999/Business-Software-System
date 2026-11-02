import { authorize } from "@/lib/platform/data/access";
import { searchResultLines, type ResultQuery } from "@/lib/modules/m2/data/orders";
import { resultMatrix } from "@/lib/modules/m2/orders";
import { csvRow } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Xuất kết quả dạng ma trận mẫu × chỉ tiêu ra CSV (mở bằng Excel; sửa rồi nhập lại được ở trang Kết quả). */
export async function GET(req: Request) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const u = new URL(req.url);
  const q = Object.fromEntries(u.searchParams) as unknown as ResultQuery & { an?: string };
  const lines = await searchResultLines({ ...q, by: q.by === "nhan-mau" || q.by === "ma-mau" ? q.by : "quan-trac" });
  const hide = q.an === "1";
  const m = resultMatrix(lines, hide);
  const head = ["#", "Mã mẫu", "Vị trí lấy mẫu", ...(hide ? [] : ["Mã mẫu của khách"]), ...m.columns.map((c) => (c.unit ? `${c.criterion} (${c.unit})` : c.criterion))];
  const csv = [csvRow(head), ...m.rows.map((r, i) => csvRow([i + 1, r.code, r.locationName, ...(hide ? [] : [r.customerSampleCode]), ...r.cells]))].join("\r\n");
  return new Response(`﻿${csv}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ket-qua_${q.by ?? "quan-trac"}_${q.from ?? q.code ?? ""}_${q.to ?? ""}.csv"` },
  });
}
