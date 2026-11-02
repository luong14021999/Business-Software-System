// Sổ & thống kê phòng thí nghiệm: mỗi báo cáo trả về cột + dòng, dùng chung cho trang xem và xuất Excel (CSV).
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { orderPaymentStore, orderStore, searchResultLines } from "@/lib/modules/m2/data/orders";
import { buildGrid, lineText } from "@/lib/modules/m2/data/grid";
import { balance, judge, normSummary, orderTotals, parseResultCell } from "@/lib/modules/m2/orders";
import { rateItemStore, rateListStore } from "@/lib/modules/m2/data/settings";
import { normalizeVi } from "@/lib/platform/format";
import { fmtDateTimeVN, fmtDateVN, vnDateOf } from "@/lib/platform/dates";

export const LAB_REPORTS = {
  "ngay-quan-trac": { title: "Thống kê theo ngày quan trắc" },
  "so-nhan-mau": { title: "Thống kê theo ngày nhận mẫu" },
  "so-giao-mau": { title: "Thống kê theo ngày nhận mẫu" },
  "thau-phu": { title: "Thống kê thông số thầu phụ" },
  "dinh-muc": { title: "Thống kê định mức" },
  "cong-no": { title: "Thống kê công nợ" },
  "so-phieu": { title: "Tổng hợp số phiếu" },
} as const;
export type LabReport = keyof typeof LAB_REPORTS;

export type Cell = string | number;
export type ReportTable = { title?: string; columns: string[]; rows: Cell[][]; total?: Cell[] };

const inRange = (d: string, from: string, to: string) => Boolean(d) && (!from || d >= from) && (!to || d <= to);

/**
 * Tham số của các trang Thống kê (như form XaLab): khoảng ngày, bảng thống kê, nút xuất (`kind`: thuc-te | danh-gia |
 * so-giao-nhan | so-giao-nhan-2 | so-thau-phu), bộ lọc phòng ban / khách hàng / đơn vị yêu cầu / loại mẫu / chỉ tiêu / thầu phụ,
 * định mức (bảng, ngày quan trắc / trả kết quả, giảm trừ) và tổng hợp số phiếu (năm, gộp theo đơn).
 */
export type StatQuery = {
  from?: string;
  to?: string;
  bang?: string;
  kind?: string;
  dept?: string;
  customer?: string;
  unit?: string;
  type?: string;
  criterion?: string;
  sub?: string;
  list?: string;
  basis?: "quan-trac" | "tra-ket-qua";
  giam?: number;
  year?: string;
  gop?: string;
};

/** Đọc tham số thống kê từ query string (form trang Thống kê hoặc link xuất file). */
export function parseStatQuery(get: (k: string) => string | null | undefined): StatQuery {
  const v = (k: string) => get(k) || undefined;
  return {
    from: v("from"), to: v("to"), bang: v("bang"), kind: v("kind"), dept: v("dept"), customer: v("customer"), unit: v("unit"),
    type: v("type"), criterion: v("criterion"), sub: v("sub"), list: v("list"), year: v("year"), gop: v("gop"),
    basis: get("basis") === "tra-ket-qua" ? "tra-ket-qua" : "quan-trac",
    giam: Math.min(100, Math.max(0, Number(get("giam")) || 0)),
  };
}

/** Tên bảng / nút xuất để ghi trên file. */
export const STAT_KIND_LABEL: Record<string, string> = {
  "thuc-te": "Excel thực tế",
  "danh-gia": "Excel đánh giá",
  "so-giao-nhan": "Sổ giao nhận mẫu",
  "so-giao-nhan-2": "Sổ giao nhận mẫu 2",
  "so-thau-phu": "Sổ theo dõi thầu phụ",
};

/** Bảng "Excel đánh giá": từng kết quả kèm giới hạn quy chuẩn (cột 1, 2) và kết luận Đạt / Vượt. */
async function evaluated(by: "quan-trac" | "nhan-mau", q: StatQuery, withQc = true): Promise<ReportTable[]> {
  const lines = await searchResultLines({ by, from: q.from, to: q.to, typeId: q.type, criterion: q.criterion, customerId: q.customer, unitId: q.unit, departmentId: q.dept, subcontractor: q.sub, withQc });
  const grid = await buildGrid(lines);
  const meta = new Map(lines.map((l) => [l.id, l]));
  const rows: Cell[][] = [];
  for (const smp of grid) {
    for (const l of smp.lines) {
      const m = meta.get(l.id);
      const p = parseResultCell(l.text);
      const v1 = judge(p, l);
      const v2 = l.lim2 ? judge(p, l.lim2) : "";
      const verdict = v1 === "Vượt" || v2 === "Vượt" ? "Vượt" : v1 || v2;
      rows.push([m?.orderCode ?? "", m?.customer ?? "", smp.code, smp.locationName, l.criterion, l.unit, l.text, l.method, l.subcontractor, l.limitLabel, l.lim2?.label ?? "", verdict === "Vượt" ? "Vượt quy chuẩn" : verdict ? "Đạt" : "", l.status]);
    }
  }
  return [{ columns: ["Đơn hàng", "Khách hàng", "Mã mẫu", "Vị trí", "Chỉ tiêu", "Đơn vị", "Kết quả", "Phương pháp", "Thầu phụ", "Quy chuẩn 1", "Quy chuẩn 2", "Đánh giá", "Trạng thái"], rows }];
}

/** Điều kiện lọc mẫu / đơn hàng chung của các trang thống kê (khách hàng, đơn vị yêu cầu, phòng ban, loại mẫu). */
function sampleFilter(q: StatQuery, params: unknown[]) {
  const where: string[] = [];
  const add = (sql: string, v?: string) => {
    if (!v) return;
    params.push(v);
    where.push(sql.replace("$?", `$${params.length}`));
  };
  add("o.customer_id::text = $?", q.customer);
  add("o.requesting_unit_id::text = $?", q.unit);
  add("o.department_id::text = $?", q.dept);
  add("s.sample_type_id::text = $?", q.type);
  return where.length ? ` and ${where.join(" and ")}` : "";
}

export async function runReport(key: LabReport, q: StatQuery): Promise<ReportTable[]> {
  if (!isDbConfigured()) return [];
  const from = q.from ?? "";
  const to = q.to ?? "";
  if (key === "dinh-muc") return normReport(from, to, q);

  if (key === "so-nhan-mau" || key === "so-giao-mau") {
    if (q.kind === "danh-gia") return evaluated("nhan-mau", q);
    const bang = q.kind === "so-giao-nhan" || q.kind === "so-giao-nhan-2" ? "so-giao-mau" : q.bang || (key === "so-giao-mau" ? "so-giao-mau" : "so-nhan-mau");
    if (bang === "so-nhan-mau") {
      const params: unknown[] = [from, to];
      const rows = await dbQuery(
        `select s.received_at, s.code, s.customer, o.code order_code, s.type, s.location_name, s.criteria, s.stage, s.status, s.customer_sample_code
         from public.samples s left join public.orders o on o.id = s.order_id
         where s.received_at is not null and ($1 = '' or s.received_at >= $1::date) and ($2 = '' or s.received_at <= $2::date)${sampleFilter(q, params)}
         order by s.received_at, s.code`,
        params,
      );
      return [{
        columns: ["Ngày nhận", "Mã mẫu", "Mã mẫu của khách", "Khách hàng", "Đơn hàng", "Loại mẫu", "Vị trí / tên mẫu", "Số chỉ tiêu", "Chỉ tiêu", "Trạng thái"],
        rows: rows.map((r) => {
          const crit = (r.criteria as string[]) ?? [];
          return [fmtDateVN(r.received_at as string), r.code as string, (r.customer_sample_code as string) ?? "", (r.customer as string) ?? "", (r.order_code as string) ?? "", (r.type as string) ?? "", (r.location_name as string) ?? "", crit.length, crit.join("; "), (r.stage as string) || (r.status as string) || ""];
        }),
      }];
    }
    const lines = await searchResultLines({ by: "nhan-mau", from, to, typeId: q.type, criterion: q.criterion, customerId: q.customer, unitId: q.unit, departmentId: q.dept });
    const who = (l: (typeof lines)[number]) => l.analyst || l.technician || "";
    if (q.kind === "so-giao-nhan-2") {
      // Sổ giao nhận mẫu 2: gom theo người nhận (người phân tích), mỗi người một dòng ký nhận.
      const byWho = new Map<string, typeof lines>();
      for (const l of lines) byWho.set(who(l) || "(chưa phân công)", [...(byWho.get(who(l) || "(chưa phân công)") ?? []), l]);
      return [{
        columns: ["Người nhận", "Số mẫu", "Số chỉ tiêu", "Mã mẫu", "Chỉ tiêu", "Ngày giao", "Ký nhận"],
        rows: [...byWho].map(([k, ls]) => [k, new Set(ls.map((l) => l.sampleCode)).size, ls.length, [...new Set(ls.map((l) => l.sampleCode))].join("; "), [...new Set(ls.map((l) => l.criterion))].join("; "), "", ""]),
      }];
    }
    if (q.kind === "so-giao-nhan") {
      return [{
        columns: ["Ngày nhận mẫu", "Mã mẫu", "Mã mẫu phụ", "Chỉ tiêu", "Phương pháp", "Người giao", "Người nhận", "Ngày giao", "Ký nhận"],
        rows: lines.map((l) => [fmtDateVN(l.receivedAt), l.sampleCode, l.subCode, l.criterion, l.method, "", who(l), "", ""]),
      }];
    }
    if (bang === "ho-so") {
      return [{
        columns: ["Ngày nhận mẫu", "Mã mẫu", "Chỉ tiêu", "Đơn vị", "Phương pháp", "Kết quả", "Người phân tích", "Mẻ thử nghiệm", "Trạng thái"],
        rows: lines.map((l) => [fmtDateVN(l.receivedAt), l.sampleCode, l.criterion, l.unit, l.method, lineText(l), who(l), l.batchId ? "có" : "", l.status]),
      }];
    }
    return [{
      columns: ["Ngày nhận", "Mã mẫu", "Chỉ tiêu", "Phương pháp", "Người phân tích", "Thầu phụ", "Trạng thái"],
      rows: lines.map((l) => [fmtDateVN(l.receivedAt), l.sampleCode, l.criterion, l.method, who(l), l.subcontractor, l.status]),
    }];
  }

  if (key === "thau-phu") {
    if (q.kind === "danh-gia") return evaluated("nhan-mau", q);
    const lines = (await searchResultLines({ by: "nhan-mau", from, to, subcontractor: q.sub })).filter((l) => q.sub || l.subcontractor);
    if (q.kind === "so-thau-phu") {
      const bySub = new Map<string, Map<string, number>>();
      for (const l of lines) {
        const m = bySub.get(l.subcontractor || "Chưa ghi") ?? new Map<string, number>();
        m.set(l.criterion, (m.get(l.criterion) ?? 0) + 1);
        bySub.set(l.subcontractor || "Chưa ghi", m);
      }
      return [
        { title: "Theo thầu phụ", columns: ["Thầu phụ", "Số lượt chỉ tiêu"], rows: [...bySub].map(([k, m]) => [k, [...m.values()].reduce((a, b) => a + b, 0)]), total: ["Cộng", lines.length] },
        { title: "Chi tiết theo chỉ tiêu", columns: ["Thầu phụ", "Chỉ tiêu", "Số lượt"], rows: [...bySub].flatMap(([k, m]) => [...m].map(([c, n]) => [k, c, n])) },
      ];
    }
    return [{ columns: ["Ngày nhận mẫu", "Đơn hàng", "Mã mẫu", "Chỉ tiêu", "Đơn vị", "Kết quả", "Phương pháp", "Thầu phụ", "Trạng thái"], rows: lines.map((l) => [fmtDateVN(l.receivedAt), l.orderCode, l.sampleCode, l.criterion, l.unit, lineText(l), l.method, l.subcontractor, l.status]) }];
  }

  const [orders, customers] = await Promise.all([orderStore.list(), getCustomers()]);
  const cust = new Map(customers.map((c) => [c.id, c.name]));
  const orderOk = (o: (typeof orders)[number]) => (!q.customer || o.customerId === q.customer) && (!q.unit || o.requestingUnitId === q.unit) && (!q.dept || o.departmentId === q.dept);

  if (key === "ngay-quan-trac") {
    if (q.kind === "danh-gia") return evaluated("quan-trac", q, q.bang !== "loai-mau");
    const bang = q.bang || "don-hang";
    if (bang === "loai-mau" || bang === "loai-mau-qc") {
      const lines = await searchResultLines({ by: "quan-trac", from, to, typeId: q.type, criterion: q.criterion, customerId: q.customer, unitId: q.unit, departmentId: q.dept, withQc: bang === "loai-mau-qc" });
      const byType = new Map<string, { samples: Set<string>; lines: number }>();
      for (const l of lines) {
        const x = byType.get(l.matrix) ?? { samples: new Set<string>(), lines: 0 };
        x.samples.add(l.sampleCode);
        x.lines++;
        byType.set(l.matrix, x);
      }
      const byCrit = new Map<string, number>();
      for (const l of lines) byCrit.set(`${l.matrix}|${l.criterion}`, (byCrit.get(`${l.matrix}|${l.criterion}`) ?? 0) + 1);
      return [
        { title: bang === "loai-mau-qc" ? "Loại mẫu (gồm mẫu QA/QC và mẫu lặp)" : "Loại mẫu (không gồm mẫu QA/QC và mẫu lặp)", columns: ["Loại mẫu", "Số mẫu", "Số chỉ tiêu"], rows: [...byType].map(([k, v]) => [k, v.samples.size, v.lines]), total: ["Cộng", [...byType.values()].reduce((s, v) => s + v.samples.size, 0), lines.length] },
        { title: "Theo chỉ tiêu", columns: ["Loại mẫu", "Chỉ tiêu", "Số lượt"], rows: [...byCrit].map(([k, n]) => [...k.split("|"), n]) },
      ];
    }
    const list = orders.filter((o) => orderOk(o) && inRange(vnDateOf(o.fieldAt), from, to)).sort((a, b) => a.fieldAt.localeCompare(b.fieldAt));
    if (bang === "nhan-su") {
      const staff = new Map<string, { orders: number; samples: number }>();
      const samples = await dbQuery(`select order_id, sampler from public.samples where order_id = any($1::uuid[])`, [list.map((o) => o.id)]);
      for (const o of list) {
        const names = new Set([o.fieldStaff, ...samples.filter((s) => s.order_id === o.id).flatMap((s) => String(s.sampler ?? "").split(","))].map((x) => String(x ?? "").trim()).filter(Boolean));
        for (const n of names) {
          const x = staff.get(n) ?? { orders: 0, samples: 0 };
          x.orders++;
          x.samples += samples.filter((s) => s.order_id === o.id && String(s.sampler ?? "").includes(n)).length;
          staff.set(n, x);
        }
      }
      return [{ columns: ["Nhân sự", "Số đơn hàng", "Số mẫu lấy"], rows: [...staff].sort((a, b) => a[0].localeCompare(b[0], "vi")).map(([k, v]) => [k, v.orders, v.samples]) }];
    }
    const stats = await dbQuery(
      `select s.order_id, count(distinct s.id)::int samples, count(r.id)::int lines, count(r.id) filter (where r.status = 'Đã duyệt')::int approved
       from public.samples s left join public.analysis_results r on r.sample_code = s.code where s.order_id is not null group by s.order_id`,
    );
    const st = new Map(stats.map((r) => [r.order_id as string, r]));
    return [{
      columns: ["Mã", "Tên", "Loại", "Khách hàng", "Đơn vị yêu cầu", "Ngày quan trắc", "Phụ trách quan trắc", "Số mẫu", "Số chỉ tiêu", "Đã duyệt", "Trạng thái"],
      rows: list.map((o) => {
        const x = st.get(o.id);
        return [o.code, o.name, o.kind, cust.get(o.customerId) ?? "", o.requestingUnit, fmtDateTimeVN(o.fieldAt), o.fieldStaff, Number(x?.samples ?? 0), Number(x?.lines ?? 0), Number(x?.approved ?? 0), o.status];
      }),
    }];
  }
  if (key === "cong-no") {
    const payments = await orderPaymentStore.list();
    const list = orders.filter((o) => o.status !== "Hủy" && orderOk(o) && inRange(vnDateOf(o.fieldAt || o.createdAt), from, to)).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    const rows = list.map((o) => {
      const t = orderTotals(o.amount, o.discountPct, o.vatRate);
      const b = balance(t.total, payments.filter((p) => p.orderId === o.id));
      return [o.code, o.name, cust.get(o.customerId) ?? "", o.requestingUnit, o.quoteNo, t.total, b.paid, b.remaining, o.status] as Cell[];
    });
    const sum = (i: number) => rows.reduce((s, r) => s + Number(r[i]), 0);
    return [{ columns: ["Mã", "Tên", "Khách hàng", "Đơn vị yêu cầu", "Số báo giá", "Giá trị (đ)", "Đã thu (đ)", "Còn lại (đ)", "Trạng thái"], rows, total: ["Cộng", "", "", "", "", sum(5), sum(6), sum(7), ""] }];
  }
  // so-phieu: theo năm (ngày trả kết quả thực tế, chưa trả thì hạn trả); gộp theo đơn hàng hoặc từng mẫu.
  const year = /^\d{4}$/.test(q.year ?? "") ? q.year! : new Date().getFullYear().toString();
  const list = orders.filter((o) => (o.reportNo || o.reportNoEn) && vnDateOf(o.deliveredAt || o.dueAt).startsWith(year)).sort((a, b) => a.reportNo.localeCompare(b.reportNo, undefined, { numeric: true }));
  if (q.gop === "khong") {
    const samples = await dbQuery(`select order_id, code, location_name from public.samples where order_id = any($1::uuid[]) order by code`, [list.map((o) => o.id)]);
    return [{
      columns: ["Số phiếu", "Số phiếu tiếng Anh", "Mã đơn hàng", "Mã mẫu", "Vị trí", "Khách hàng", "Ngày trả kết quả"],
      rows: list.flatMap((o) => samples.filter((s) => s.order_id === o.id).map((s) => [o.reportNo, o.reportNoEn, o.code, s.code as string, (s.location_name as string) ?? "", cust.get(o.customerId) ?? "", fmtDateTimeVN(o.deliveredAt || o.dueAt)])),
    }];
  }
  return [{
    columns: ["Số phiếu", "Số phiếu tiếng Anh", "Loại số phiếu", "Mã đơn hàng", "Tên", "Khách hàng", "Ngày trả kết quả", "Hình thức trả"],
    rows: list.map((o) => [o.reportNo, o.reportNoEn, o.reportNoKind, o.code, o.name, cust.get(o.customerId) ?? "", fmtDateTimeVN(o.deliveredAt || o.dueAt), o.deliveryMethod]),
  }];
}

async function normReport(from: string, to: string, opts: StatQuery): Promise<ReportTable[]> {
  const lists = (await rateListStore.list()).filter((l) => l.kind === "norm");
  const list = lists.find((l) => l.id === opts.list) ?? lists.find((l) => l.active) ?? lists[0];
  if (!list) return [{ title: "Chưa có bảng định mức – thêm ở Cài đặt → Bảng định mức", columns: [], rows: [] }];
  const col = opts.basis === "tra-ket-qua" ? "coalesce(o.delivered_at, o.due_at)" : "o.field_at";
  const lines = await dbQuery(
    `select r.matrix, r.criterion from public.analysis_results r
     join public.samples s on s.code = r.sample_code join public.orders o on o.id = s.order_id
     where r.status = 'Đã duyệt' and o.status <> 'Hủy' and ${col} is not null
       and ($1 = '' or ${col} >= $1::date) and ($2 = '' or ${col} < ($2::date + 1))`,
    [from, to],
  );
  const [items, types] = await Promise.all([rateItemStore.list(), (await import("@/lib/modules/m2/data/orders")).sampleTypeStore.list()]);
  const typeId = new Map(types.map((t) => [t.name, t.id]));
  const mine = items.filter((i) => i.listId === list.id);
  const r = normSummary(
    lines.map((l) => ({ matrix: (l.matrix as string) ?? "", criterion: (l.criterion as string) ?? "" })),
    (m, c) => mine.find((i) => i.sampleTypeId === typeId.get(m) && normalizeVi(i.analyte) === normalizeVi(c))?.amount,
    opts.giam ?? 0,
  );
  const out: ReportTable[] = [
    {
      title: `Theo ${list.name}${opts.giam ? ` · giảm trừ ${opts.giam}%` : ""}`,
      columns: ["Chỉ tiêu (loại mẫu)", "Số lượt", "Đơn giá định mức (đ)", "Thành tiền (đ)"],
      rows: r.rows.map((x) => [x.analyte, x.count, x.rate, x.amount]),
      total: ["Cộng", r.rows.reduce((s, x) => s + x.count, 0), "", r.gross],
    },
    { title: "Tổng hợp", columns: ["Khoản", "Số tiền (đ)"], rows: [["Tổng theo định mức", r.gross], [`Giảm trừ ${opts.giam ?? 0}%`, -r.deduction], ["Còn lại", r.net]] },
  ];
  if (r.missing.length) out.push({ title: "Chỉ tiêu chưa có trong bảng định mức (tính 0 đ)", columns: ["Loại mẫu · chỉ tiêu"], rows: r.missing.map((m) => [m]) });
  return out;
}
