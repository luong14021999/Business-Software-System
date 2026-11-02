// Danh sách số phiếu kết quả (migration 0041): mỗi lần cấp số cho một đơn hàng.
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { formatReportNo, nextReportStart } from "@/lib/modules/m2/report-numbers";

export type ReportNumber = { id: string; createdAt: string; createdBy: string; orderId: string; year: number; kind: string; startNo: number; quantity: number; deletedAt: string; deletedBy: string };
export const reportNumberStore = createEntityStore<ReportNumber>(
  "report-numbers",
  [],
  columnsMapping<ReportNumber>("report_numbers", { createdAt: "date", createdBy: "text", orderId: "ref", year: "number", kind: "text", startNo: "number", quantity: "number", deletedAt: "date", deletedBy: "text" }),
);

/** Cấp số phiếu tiếp theo cho đơn hàng và ghi vào ô "Số phiếu kết quả" của đơn. */
export async function allocateReportNo(orderId: string, kind: string, quantity: number, actor: string) {
  const year = new Date().getFullYear();
  const issued = (await reportNumberStore.list()).filter((r) => !r.deletedAt && r.year === year && r.kind === kind);
  const startNo = nextReportStart(issued);
  const item = await reportNumberStore.create({ id: "", createdAt: new Date().toISOString(), createdBy: actor, orderId, year, kind, startNo, quantity, deletedAt: "", deletedBy: "" });
  const reportNo = formatReportNo(startNo, quantity, year);
  await orderStore.update(orderId, { reportNo, reportNoKind: kind });
  return { item, reportNo };
}

/** Xóa (đánh dấu) lần cấp số mới nhất của loại số phiếu; xóa số trên đơn nếu đơn vẫn mang số đó. */
export async function deleteLatestReportNo(kind: string, actor: string) {
  const latest = (await reportNumberStore.list()).filter((r) => !r.deletedAt && r.kind === kind).sort((a, b) => b.year - a.year || b.startNo - a.startNo)[0];
  if (!latest) return null;
  await reportNumberStore.update(latest.id, { deletedAt: new Date().toISOString(), deletedBy: actor });
  const no = formatReportNo(latest.startNo, latest.quantity, latest.year);
  const order = latest.orderId ? (await orderStore.list()).find((o) => o.id === latest.orderId) : undefined;
  if (order && order.reportNo === no) await orderStore.update(order.id, { reportNo: "" });
  return { latest, no, orderCode: order?.code ?? "" };
}
