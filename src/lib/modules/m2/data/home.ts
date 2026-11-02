// Số liệu trang chủ phòng thí nghiệm (GĐ8): biểu đồ 6 tháng, lịch quan trắc tự sinh từ đơn hàng.
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { orderStore, sampleTypeStore, workScheduleStore, type WorkItem } from "@/lib/modules/m2/data/orders";
import { orderPlanStore } from "@/lib/modules/m2/data/order-extras";
import { ORDER_STATUSES, fieldDuties, orderEvents, stackByMonth, type OrderLike, type lastMonths } from "@/lib/modules/m2/orders";
import { vnDateOf } from "@/lib/platform/dates";

type Months = ReturnType<typeof lastMonths>;
const VN = "Asia/Ho_Chi_Minh";

/** Số đơn hàng tạo mới mỗi tháng, chia theo trạng thái hiện tại. */
export async function ordersByMonth(months: Months) {
  if (!isDbConfigured() || !months.length) return stackByMonth([], months, [...ORDER_STATUSES]);
  const rows = await dbQuery(
    `select to_char(created_at at time zone '${VN}', 'YYYY-MM') m, coalesce(status, 'Báo giá') st, count(*)::int n
     from public.orders where to_char(created_at at time zone '${VN}', 'YYYY-MM') between $1 and $2 group by 1, 2`,
    [months[0].key, months[months.length - 1].key],
  ).catch(() => []);
  return stackByMonth(rows.map((r) => ({ month: r.m as string, key: r.st as string, n: Number(r.n) })), months, [...ORDER_STATUSES]);
}

/**
 * Số mẫu đã trả kết quả mỗi tháng theo loại mẫu: mẫu ở trạng thái "Trả kết quả" hoặc thuộc đơn đã trả / thanh lý,
 * tính theo ngày trả thực tế của đơn (chưa ghi thì theo hạn trả).
 */
export async function returnedSamplesByMonth(months: Months) {
  const types = (await sampleTypeStore.list()).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)).map((t) => t.name);
  if (!isDbConfigured() || !months.length) return stackByMonth([], months, types);
  const rows = await dbQuery(
    `select to_char(coalesce(o.delivered_at, s.due_at::timestamptz, o.due_at) at time zone '${VN}', 'YYYY-MM') m, coalesce(s.type, 'Khác') t, count(*)::int n
     from public.samples s join public.orders o on o.id = s.order_id
     where (s.stage = 'Trả kết quả' or o.status in ('Trả kết quả', 'Thanh lý')) and coalesce(s.stage, '') <> 'Hủy mẫu'
       and to_char(coalesce(o.delivered_at, s.due_at::timestamptz, o.due_at) at time zone '${VN}', 'YYYY-MM') between $1 and $2
     group by 1, 2`,
    [months[0].key, months[months.length - 1].key],
  ).catch(() => []);
  return stackByMonth(rows.map((r) => ({ month: r.m as string, key: r.t as string, n: Number(r.n) })), months, types);
}

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
      .map((d) => ({ id: `auto-${d.orderId}-${d.day}-${d.staffName}`, ...d, hours: null, note: "Tự động từ kế hoạch quan trắc", createdBy: "", auto: true })),
  ];
}
