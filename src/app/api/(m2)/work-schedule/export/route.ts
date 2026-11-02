import { authorize } from "@/lib/platform/data/access";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { scheduleBetween } from "@/lib/modules/m2/data/home";
import { csvRow } from "@/lib/platform/format";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** Xuất lịch công tác (kể cả lịch quan trắc tự sinh từ đơn hàng) trong khoảng ngày ra CSV (mở bằng Excel, có BOM UTF-8). */
export async function GET(req: Request) {
  const gate = await authorize("write.any");
  if (!gate.ok) return gate.response;
  const u = new URL(req.url);
  const from = u.searchParams.get("from") || "0000-01-01";
  const to = u.searchParams.get("to") || "9999-12-31";
  const [items, orders] = await Promise.all([scheduleBetween(from, to), orderStore.list()]);
  const code = new Map(orders.map((o) => [o.id, o.code]));
  const rows = items.sort((a, b) => a.day.localeCompare(b.day) || a.staffName.localeCompare(b.staffName, "vi"));
  const csv = [
    csvRow(["Ngày", "Nhân viên", "Loại", "Kế hoạch", "Số giờ", "Đơn hàng", "Ghi chú"]),
    ...rows.map((w) => csvRow([fmtDateVN(w.day), w.staffName, w.kind, w.title, w.hours ?? "", code.get(w.orderId) ?? "", w.note])),
  ].join("\r\n");
  return new Response(`﻿${csv}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="lich-cong-tac_${from}_${to}.csv"` },
  });
}
