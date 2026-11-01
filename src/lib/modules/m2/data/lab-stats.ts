// Sổ & thống kê phòng thí nghiệm: mỗi báo cáo trả về cột + dòng, dùng chung cho trang xem và xuất Excel (CSV).
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { orderPaymentStore, orderStore } from "@/lib/modules/m2/data/orders";
import { balance, orderTotals } from "@/lib/modules/m2/orders";
import { fmtDateTimeVN, fmtDateVN, vnDateOf } from "@/lib/platform/dates";

export const LAB_REPORTS = {
  "so-nhan-mau": { title: "Sổ nhận mẫu", hint: "Mẫu nhận trong khoảng ngày (theo ngày nhận mẫu)" },
  "so-giao-mau": { title: "Sổ giao mẫu", hint: "Chỉ tiêu giao cho người phân tích (theo ngày nhận mẫu)" },
  "ngay-quan-trac": { title: "Thống kê theo ngày quan trắc", hint: "Đơn hàng có ngày quan trắc / lấy mẫu trong khoảng" },
  "thau-phu": { title: "Thống kê thông số thầu phụ", hint: "Số lượt chỉ tiêu theo phạm vi thực hiện (VILAS / nội bộ / thầu phụ)" },
  "cong-no": { title: "Thống kê công nợ", hint: "Giá trị, đã thu, còn lại của đơn hàng có ngày quan trắc trong khoảng" },
  "so-phieu": { title: "Tổng hợp số phiếu kết quả", hint: "Đơn hàng có số phiếu kết quả, theo ngày trả kết quả thực tế" },
} as const;
export type LabReport = keyof typeof LAB_REPORTS;

export type Cell = string | number;
export type ReportTable = { title?: string; columns: string[]; rows: Cell[][]; total?: Cell[] };

const inRange = (d: string, from: string, to: string) => Boolean(d) && (!from || d >= from) && (!to || d <= to);

export async function runReport(key: LabReport, from: string, to: string): Promise<ReportTable[]> {
  if (!isDbConfigured()) return [];
  if (key === "so-nhan-mau") {
    const rows = await dbQuery(
      `select s.received_at, s.code, s.customer, o.code order_code, s.type, s.location_name, s.criteria, s.stage, s.status
       from public.samples s left join public.orders o on o.id = s.order_id
       where s.received_at is not null and ($1 = '' or s.received_at >= $1::date) and ($2 = '' or s.received_at <= $2::date)
       order by s.received_at, s.code`,
      [from, to],
    );
    return [{
      columns: ["Ngày nhận", "Mã mẫu", "Khách hàng", "Đơn hàng", "Loại mẫu", "Vị trí / tên mẫu", "Số chỉ tiêu", "Chỉ tiêu", "Trạng thái"],
      rows: rows.map((r) => {
        const crit = (r.criteria as string[]) ?? [];
        return [fmtDateVN(r.received_at as string), r.code as string, (r.customer as string) ?? "", (r.order_code as string) ?? "", (r.type as string) ?? "", (r.location_name as string) ?? "", crit.length, crit.join("; "), (r.stage as string) || (r.status as string) || ""];
      }),
    }];
  }
  if (key === "so-giao-mau") {
    const rows = await dbQuery(
      `select s.received_at, r.sample_code, r.criterion, r.method, coalesce(nullif(b.analyst, ''), r.technician) analyst, b.code batch_code, r.subcontractor, r.status
       from public.analysis_results r join public.samples s on s.code = r.sample_code
       left join public.test_batches b on b.id = r.batch_id
       where s.received_at is not null and ($1 = '' or s.received_at >= $1::date) and ($2 = '' or s.received_at <= $2::date)
       order by s.received_at, r.sample_code, coalesce(r.sort, 0)`,
      [from, to],
    );
    return [{
      columns: ["Ngày nhận", "Mã mẫu", "Chỉ tiêu", "Phương pháp", "Người phân tích", "Mẻ thử nghiệm", "Phạm vi", "Trạng thái"],
      rows: rows.map((r) => [fmtDateVN(r.received_at as string), r.sample_code as string, r.criterion as string, (r.method as string) ?? "", (r.analyst as string) ?? "", (r.batch_code as string) ?? "", (r.subcontractor as string) ?? "", r.status as string]),
    }];
  }
  if (key === "thau-phu") {
    const rows = await dbQuery(
      `select coalesce(nullif(r.subcontractor, ''), 'Chưa ghi') sub, r.criterion, count(*)::int n
       from public.analysis_results r join public.samples s on s.code = r.sample_code
       where ($1 = '' or s.received_at >= $1::date) and ($2 = '' or s.received_at <= $2::date)
       group by 1, 2 order by 1, 3 desc, 2`,
      [from, to],
    );
    const bySub = new Map<string, number>();
    for (const r of rows) bySub.set(r.sub as string, (bySub.get(r.sub as string) ?? 0) + Number(r.n));
    return [
      { title: "Theo phạm vi thực hiện", columns: ["Phạm vi / thầu phụ", "Số lượt chỉ tiêu"], rows: [...bySub].map(([k, v]) => [k, v]), total: ["Cộng", [...bySub.values()].reduce((a, b) => a + b, 0)] },
      { title: "Chi tiết theo chỉ tiêu", columns: ["Phạm vi / thầu phụ", "Chỉ tiêu", "Số lượt"], rows: rows.map((r) => [r.sub as string, r.criterion as string, Number(r.n)]) },
    ];
  }

  const [orders, customers] = await Promise.all([orderStore.list(), getCustomers()]);
  const cust = new Map(customers.map((c) => [c.id, c.name]));
  if (key === "ngay-quan-trac") {
    const stats = await dbQuery(
      `select s.order_id, count(distinct s.id)::int samples, count(r.id)::int lines, count(r.id) filter (where r.status = 'Đã duyệt')::int approved
       from public.samples s left join public.analysis_results r on r.sample_code = s.code where s.order_id is not null group by s.order_id`,
    );
    const types = await dbQuery(
      `select s.type, count(*)::int n from public.samples s join public.orders o on o.id = s.order_id
       where o.field_at is not null and ($1 = '' or o.field_at >= $1::date) and ($2 = '' or o.field_at < ($2::date + 1)) group by 1 order by 2 desc`,
      [from, to],
    );
    const st = new Map(stats.map((r) => [r.order_id as string, r]));
    const list = orders.filter((o) => inRange(vnDateOf(o.fieldAt), from, to)).sort((a, b) => a.fieldAt.localeCompare(b.fieldAt));
    const staff = new Map<string, number>();
    for (const o of list) if (o.fieldStaff) staff.set(o.fieldStaff, (staff.get(o.fieldStaff) ?? 0) + 1);
    return [
      {
        title: "Đơn hàng",
        columns: ["Mã", "Tên", "Loại", "Khách hàng", "Ngày quan trắc", "Phụ trách quan trắc", "Số mẫu", "Số chỉ tiêu", "Đã duyệt", "Trạng thái"],
        rows: list.map((o) => {
          const s = st.get(o.id);
          return [o.code, o.name, o.kind, cust.get(o.customerId) ?? "", fmtDateTimeVN(o.fieldAt), o.fieldStaff, Number(s?.samples ?? 0), Number(s?.lines ?? 0), Number(s?.approved ?? 0), o.status];
        }),
      },
      { title: "Theo loại mẫu", columns: ["Loại mẫu", "Số mẫu"], rows: types.map((r) => [r.type as string, Number(r.n)]) },
      { title: "Theo nhân sự quan trắc", columns: ["Nhân sự", "Số đơn hàng"], rows: [...staff].map(([k, v]) => [k, v]) },
    ];
  }
  if (key === "cong-no") {
    const payments = await orderPaymentStore.list();
    const list = orders.filter((o) => o.status !== "Hủy" && inRange(vnDateOf(o.fieldAt || o.createdAt), from, to)).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    const rows = list.map((o) => {
      const t = orderTotals(o.amount, o.discountPct, o.vatRate);
      const b = balance(t.total, payments.filter((p) => p.orderId === o.id));
      return [o.code, o.name, cust.get(o.customerId) ?? "", o.quoteNo, t.total, b.paid, b.remaining, o.status] as Cell[];
    });
    const sum = (i: number) => rows.reduce((s, r) => s + Number(r[i]), 0);
    return [{ columns: ["Mã", "Tên", "Khách hàng", "Số báo giá", "Giá trị (đ)", "Đã thu (đ)", "Còn lại (đ)", "Trạng thái"], rows, total: ["Cộng", "", "", "", sum(4), sum(5), sum(6), ""] }];
  }
  // so-phieu
  const list = orders.filter((o) => o.reportNo && inRange(vnDateOf(o.deliveredAt || o.dueAt), from, to)).sort((a, b) => a.reportNo.localeCompare(b.reportNo, undefined, { numeric: true }));
  return [{
    columns: ["Số phiếu", "Mã đơn hàng", "Tên", "Khách hàng", "Ngày trả kết quả", "Hình thức trả"],
    rows: list.map((o) => [o.reportNo, o.code, o.name, cust.get(o.customerId) ?? "", fmtDateTimeVN(o.deliveredAt || o.dueAt), o.deliveryMethod]),
  }];
}
