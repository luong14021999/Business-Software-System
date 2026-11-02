// Số liệu trang chủ phòng thí nghiệm (GĐ8): lịch quan trắc tự sinh từ đơn hàng, mốc đơn hàng.
import { orderStore, workScheduleStore, type WorkItem } from "@/lib/modules/m2/data/orders";
import { orderPlanStore } from "@/lib/modules/m2/data/order-extras";
import { fieldDuties, orderEvents, type OrderLike } from "@/lib/modules/m2/orders";
import { vnDateOf } from "@/lib/platform/dates";

/** Đơn hàng với các mốc ngày đã quy về ngày Việt Nam (dùng cho lịch). */
async function ordersVN(): Promise<OrderLike[]> {
  return (await orderStore.list()).map((o) => ({
    id: o.id,
    code: o.code,
    name: o.name,
    status: o.status,
    fieldAt: vnDateOf(o.fieldAt),
    dueAt: vnDateOf(o.dueAt),
    fieldStaff: o.fieldStaff ?? "",
  }));
}

/** Lịch quan trắc tự sinh từ kế hoạch quan trắc / người phụ trách quan trắc của đơn trong [from, to]. */
export async function fieldDutiesBetween(from: string, to: string) {
  const [plans, orders] = await Promise.all([orderPlanStore.list(), ordersVN()]);
  return fieldDuties(plans.map((p) => ({ ...p, startAt: vnDateOf(p.startAt), endAt: vnDateOf(p.endAt) })), orders, from, to);
}

/** Mốc quan trắc và hạn trả kết quả theo đơn hàng trong [from, to]. */
export async function orderEventsBetween(from: string, to: string) {
  return orderEvents(await ordersVN(), from, to);
}

export type ScheduleEntry = WorkItem & { auto: boolean };

/**
 * Lịch công tác trong [from, to] = kế hoạch nhập tay + lịch quan trắc tự sinh từ đơn hàng.
 * Bỏ dòng tự sinh nếu đã có dòng nhập tay cùng người, cùng ngày, cùng đơn.
 */
export async function scheduleBetween(from: string, to: string): Promise<ScheduleEntry[]> {
  const [items, duties] = await Promise.all([workScheduleStore.list(), fieldDutiesBetween(from, to)]);
  const manual = items.filter((w) => w.day >= from && w.day <= to);
  const has = new Set(manual.map((w) => `${w.staffName}|${w.day}|${w.orderId}`));
  return [
    ...manual.map((w) => ({ ...w, auto: false })),
    ...duties
      .filter((d) => !has.has(`${d.staffName}|${d.day}|${d.orderId}`))
      .map((d) => ({ id: `auto-${d.orderId}-${d.day}-${d.staffName}`, ...d, hours: null, workTime: "", note: "Tự động từ kế hoạch quan trắc", createdBy: "", auto: true })),
  ];
}
