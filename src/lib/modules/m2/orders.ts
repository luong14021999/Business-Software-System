// Đơn hàng → yêu cầu (mẫu) → kết quả: hàm thuần, kiểm thử được.

export const ORDER_KINDS = ["Mẫu gửi", "Quan trắc môi trường", "Môi trường lao động", "Nông sản – thực phẩm"] as const;
export type OrderKind = (typeof ORDER_KINDS)[number];

/** Vòng đời đơn hàng theo thứ tự; "Hủy" có thể đặt ở bất kỳ bước nào. */
export const ORDER_STATUSES = ["Báo giá", "Quan trắc", "Phân tích", "Trả kết quả", "Thanh lý", "Hủy"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Màu chữ trạng thái đơn trên danh sách. */
export const ORDER_STATUS_TONE: Record<string, string> = {
  "Báo giá": "text-rose-700",
  "Quan trắc": "text-orange-600",
  "Phân tích": "text-teal-700",
  "Trả kết quả": "text-blue-700",
  "Thanh lý": "text-muted-foreground",
  "Hủy": "text-muted-foreground line-through",
};

/** Phạm vi thực hiện chỉ tiêu (cột "Thầu phụ" khi bóc tách / nhập kết quả). */
export const ANALYTE_SCOPES = ["VILAS", "Nội bộ", "Thầu phụ"] as const;

/** Tên hiển thị của quy chuẩn kèm cột áp dụng. */
export const specLabel = (s: { name: string; columnName: string }) => (s.columnName ? `${s.name} · ${s.columnName}` : s.name);

/** Trạng thái của từng yêu cầu (mẫu) trong đơn. */
export const SAMPLE_STAGES = [
  "Đợi lấy mẫu",
  "Lấy mẫu",
  "Nhận mẫu",
  "Đang phân tích",
  "Đợi duyệt",
  "Duyệt",
  "Không duyệt",
  "Trả kết quả",
  "Lưu mẫu",
  "Hủy mẫu",
] as const;
export type SampleStage = (typeof SAMPLE_STAGES)[number];

/** Trạng thái tiếp nhận cũ của bảng mẫu (các trang khác vẫn dùng) suy ra từ trạng thái yêu cầu. */
export function legacySampleStatus(stage: string) {
  switch (stage) {
    case "Đang phân tích":
      return "Đang phân tích";
    case "Đợi duyệt":
    case "Không duyệt":
      return "Chờ duyệt";
    case "Duyệt":
      return "Hoàn thành";
    case "Trả kết quả":
    case "Lưu mẫu":
    case "Hủy mẫu":
      return "Đã trả KQ";
    default:
      return "Đã tiếp nhận";
  }
}

/** Thao tác hàng loạt trên danh sách yêu cầu: nút → trạng thái mới. */
export const STAGE_ACTIONS = { "Lấy mẫu": "Lấy mẫu", "Nhận mẫu": "Nhận mẫu", "Trả kết quả": "Trả kết quả" } as const;

/** Mã đơn hàng kế tiếp trong năm: "26.7" (2 số cuối của năm . số thứ tự). */
export function nextOrderCode(year: number, existing: string[]) {
  const yy = String(year % 100).padStart(2, "0");
  const max = existing.reduce((m, c) => {
    const [a, b] = c.split(".");
    return a === yy && /^\d+$/.test(b ?? "") ? Math.max(m, Number(b)) : m;
  }, 0);
  return `${yy}.${max + 1}`;
}

/** "2026-07-30" → "300726" (ngày tháng năm 2 số, dùng trong mã mẫu). */
export const dateStamp = (iso: string) => `${iso.slice(8, 10)}${iso.slice(5, 7)}${iso.slice(2, 4)}`;

/**
 * Sinh `count` mã mẫu theo tiền tố loại mẫu và ngày: NM300726-001, NM300726-002…
 * Bỏ qua các số đã dùng trong cùng tiền tố + ngày.
 */
export function nextSampleCodes(prefix: string, isoDate: string, existing: string[], count: number) {
  const head = `${prefix}${dateStamp(isoDate)}-`;
  let max = 0;
  for (const c of existing) {
    if (!c.startsWith(head)) continue;
    const n = Number(c.slice(head.length));
    if (Number.isInteger(n)) max = Math.max(max, n);
  }
  return Array.from({ length: count }, (_, i) => `${head}${String(max + i + 1).padStart(3, "0")}`);
}

/** So kết quả với giới hạn quy chuẩn: trong giới hạn → "Đạt", ngoài → "Vượt"; thiếu dữ liệu → "". */
export function compareLimit(value: number, min?: number | null, max?: number | null, prefix = ""): "Đạt" | "Vượt" | "" {
  if (min == null && max == null) return "";
  if (prefix === "KPH") return min != null && min > 0 ? "Vượt" : "Đạt";
  if (!Number.isFinite(value)) return "";
  // "<x": giá trị thật nhỏ hơn x → chỉ vượt khi chính x vẫn dưới mức tối thiểu.
  if (prefix === "<") return min != null && value <= min ? "Vượt" : "Đạt";
  if (max != null && value > max) return "Vượt";
  if (min != null && value < min) return "Vượt";
  return "Đạt";
}

/** Giới hạn dạng chữ để hiển thị: "6,5 – 8,5", "≤ 50", "≥ 4". */
export function limitText(min?: number | null, max?: number | null) {
  const f = (v: number) => v.toLocaleString("vi-VN");
  if (min != null && max != null) return `${f(min)} – ${f(max)}`;
  if (max != null) return `≤ ${f(max)}`;
  if (min != null) return `≥ ${f(min)}`;
  return "";
}

/** Đọc ô kết quả người dùng gõ: "<0,05" → { prefix "<", value 0.05 }; "KPH" → không phát hiện. */
export function parseResultCell(text: string): { prefix: string; value: number } | null {
  const t = String(text ?? "").trim();
  if (!t) return null;
  if (/^kph$/i.test(t)) return { prefix: "KPH", value: NaN };
  const m = t.match(/^([<>])?\s*(-?[\d.,]+)$/);
  if (!m) return null;
  const raw = m[2];
  // "1.234,5" (kiểu Việt) hoặc "1234.5" (kiểu Anh)
  const norm = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const value = Number(norm);
  return Number.isFinite(value) ? { prefix: m[1] ?? "", value } : null;
}

/** Số ngày trễ so với hạn (0 nếu chưa trễ hoặc không có hạn). */
export function overdueDays(dueISO: string | null | undefined, todayISO: string) {
  if (!dueISO) return 0;
  const d = Math.floor((Date.parse(todayISO.slice(0, 10)) - Date.parse(dueISO.slice(0, 10))) / 86_400_000);
  return d > 0 ? d : 0;
}

// ── Mẻ thử nghiệm ───────────────────────────────────────────────────

export const BATCH_STATUSES = ["Phân tích", "Duyệt", "Trả kết quả"] as const;

/** Mã mẻ kế tiếp trong tháng: 2026.11.001. */
export function nextBatchCode(isoDate: string, existing: string[]) {
  const head = `${isoDate.slice(0, 4)}.${isoDate.slice(5, 7)}.`;
  const max = existing.reduce((m, c) => (c.startsWith(head) && /^\d+$/.test(c.slice(head.length)) ? Math.max(m, Number(c.slice(head.length))) : m), 0);
  return `${head}${String(max + 1).padStart(3, "0")}`;
}

// ── Lịch công tác ───────────────────────────────────────────────────

export const SCHEDULE_KINDS = ["Kế hoạch quan trắc", "Lấy mẫu", "Phân tích", "Công tác", "Họp", "Nghỉ phép", "Khác"] as const;
const WEEKDAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

/** 7 ngày (thứ 2 → chủ nhật) của tuần chứa `isoDate`. */
export function weekOf(isoDate: string) {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setUTCDate(monday.getUTCDate() + i);
    const iso = x.toISOString().slice(0, 10);
    return { iso, label: `${WEEKDAYS[x.getUTCDay()]} - ${x.getUTCDate()}/${x.getUTCMonth() + 1}` };
  });
}

/** Cộng `days` ngày vào "YYYY-MM-DD". */
export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Số tuần ISO 8601 của ngày. */
export function isoWeek(isoDate: string) {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

// ── Báo giá & công nợ ───────────────────────────────────────────────

/** Giá trị đơn hàng: trước thuế → giảm giá → thuế GTGT → tổng (làm tròn đồng). */
export function orderTotals(amount: number, discountPct = 0, vatRate = 0) {
  const sub = Math.round(Number(amount) || 0);
  const discount = Math.round((sub * Math.min(100, Math.max(0, Number(discountPct) || 0))) / 100);
  const afterDiscount = sub - discount;
  const vat = Math.round((afterDiscount * Math.max(0, Number(vatRate) || 0)) / 100);
  return { sub, discount, afterDiscount, vat, total: afterDiscount + vat };
}

/** Đã thanh toán / còn lại (không âm). */
export function balance(total: number, payments: { amount: number }[]) {
  const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  return { paid, remaining: Math.max(0, total - paid) };
}

export type QuoteLine = { matrix: string; criterion: string; unit: string; samples: number; unitPrice: number; amount: number };

/**
 * Bảng kê báo giá từ các dòng kết quả của đơn: gộp theo chỉ tiêu, số mẫu × đơn giá tham khảo.
 * Đơn giá tìm theo loại mẫu + tên chỉ tiêu, không có thì 0 (người lập báo giá điền tay).
 */
export function quoteLines(
  lines: { criterion: string; unit: string; matrix: string }[],
  priceOf: (matrix: string, criterion: string) => number,
): QuoteLine[] {
  const m = new Map<string, QuoteLine>();
  for (const l of lines) {
    const key = `${l.matrix}|${l.criterion}`;
    const cur = m.get(key) ?? { matrix: l.matrix, criterion: l.criterion, unit: l.unit, samples: 0, unitPrice: priceOf(l.matrix, l.criterion), amount: 0 };
    cur.samples++;
    cur.amount = cur.samples * cur.unitPrice;
    m.set(key, cur);
  }
  return [...m.values()];
}

// ── Thống kê định mức ───────────────────────────────────────────────

export type NormRow = { analyte: string; count: number; rate: number; amount: number };

/** Gộp số lượt chỉ tiêu × đơn giá định mức, trừ tỷ lệ giảm trừ (%) trên tổng. */
export function normSummary(lines: { matrix: string; criterion: string }[], rateOf: (matrix: string, criterion: string) => number | undefined, deductionPct = 0) {
  const m = new Map<string, NormRow>();
  const missing = new Set<string>();
  for (const l of lines) {
    const rate = rateOf(l.matrix, l.criterion);
    if (rate === undefined) missing.add(`${l.matrix} · ${l.criterion}`);
    const key = `${l.matrix}|${l.criterion}`;
    const cur = m.get(key) ?? { analyte: `${l.criterion} (${l.matrix})`, count: 0, rate: rate ?? 0, amount: 0 };
    cur.count++;
    cur.amount = cur.count * cur.rate;
    m.set(key, cur);
  }
  const rows = [...m.values()].sort((a, b) => b.amount - a.amount);
  const gross = rows.reduce((s, r) => s + r.amount, 0);
  const deduction = Math.round((gross * Math.min(100, Math.max(0, Number(deductionPct) || 0))) / 100);
  return { rows, gross, deduction, net: gross - deduction, missing: [...missing] };
}

// ── Danh mục chi tiết (GĐ5) ─────────────────────────────────────────

/** Số chữ số thập phân khi in theo độ lớn của kết quả. */
export type DecimalRules = { lt0_1?: number; lt1?: number; lt10?: number; lt100?: number; lt1000?: number; ge1000?: number };
export const DECIMAL_BANDS: { key: keyof DecimalRules; label: string }[] = [
  { key: "lt0_1", label: "< 0,1" },
  { key: "lt1", label: "< 1" },
  { key: "lt10", label: "< 10" },
  { key: "lt100", label: "< 100" },
  { key: "lt1000", label: "< 1000" },
  { key: "ge1000", label: "≥ 1000" },
];

/** Làm tròn để in: chọn số chữ số thập phân theo khoảng giá trị tuyệt đối; không có quy tắc → giữ nguyên. */
export function roundForPrint(value: number, rules?: DecimalRules | null) {
  if (!Number.isFinite(value)) return "";
  const a = Math.abs(value);
  const d = !rules ? undefined : a < 0.1 ? rules.lt0_1 : a < 1 ? rules.lt1 : a < 10 ? rules.lt10 : a < 100 ? rules.lt100 : a < 1000 ? rules.lt1000 : rules.ge1000;
  if (d == null || !Number.isInteger(d) || d < 0 || d > 8) return value.toLocaleString("vi-VN", { maximumFractionDigits: 8 });
  return value.toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/**
 * Công thức tạo cột quy chuẩn mới từ cột có sẵn (VD Cmax = C × Kp × Kq): chuỗi các phép "*số" hoặc "/số".
 * Trả về hàm áp lên giá trị, hoặc null nếu công thức không hợp lệ (chặn mọi biểu thức khác).
 */
export function parseFactorFormula(expr: string): ((v: number) => number) | null {
  const s = String(expr ?? "").replace(/\s+/g, "").replace(/,/g, ".");
  if (!/^([*/]\d+(\.\d+)?)+$/.test(s)) return null;
  const ops = [...s.matchAll(/([*/])(\d+(?:\.\d+)?)/g)].map((m) => ({ op: m[1], n: Number(m[2]) }));
  if (ops.some((o) => o.op === "/" && o.n === 0)) return null;
  return (v: number) => Math.round(ops.reduce((x, o) => (o.op === "*" ? x * o.n : x / o.n), v) * 1e6) / 1e6;
}

/** Kết quả ngoài giới hạn phát hiện của phương pháp (min/max có thể trống; "<x" coi là dưới min nếu x ≤ min). */
export function outOfMethodRange(value: number, prefix: string, min?: number | null, max?: number | null) {
  if (prefix === "KPH" || !Number.isFinite(value)) return false;
  if (prefix === "<") return false; // đã báo dưới giới hạn phát hiện
  return (min != null && value < min) || (max != null && value > max);
}

/** Giới hạn quy chuẩn dạng chữ để in: "KPH", "Không mùi", "-" (không quy định) hoặc số. */
export function specLimitText(l: { minValue: number | null; maxValue: number | null; notDetected?: boolean; ndText?: string }) {
  if (l.notDetected) return l.ndText?.trim() || "KPH";
  if (l.minValue === 0 && l.maxValue === 0) return "-";
  return limitText(l.minValue, l.maxValue);
}

/** Đánh giá kết quả so với quy chuẩn của dòng: quy chuẩn "không phát hiện" chỉ đạt khi KPH / "<giới hạn" / 0. */
export function judge(p: { prefix: string; value: number } | null, l: { min: number | null; max: number | null; ndRequired?: boolean }): "Đạt" | "Vượt" | "" {
  if (!p) return "";
  if (l.ndRequired) return p.prefix === "KPH" || p.prefix === "<" || p.value === 0 ? "Đạt" : "Vượt";
  return compareLimit(p.value, l.min, l.max, p.prefix);
}

// ── Báo giá nhiều phiên bản (GĐ6) ───────────────────────────────────

export type QuoteItem = { label: string; unit: string; quantity: number; unitPrice: number; group?: string };

/** Số báo giá phiên bản kế tiếp của đơn: "26.6/BG.1", "26.6/BG.2"… */
export function nextQuoteCode(orderCode: string, existing: string[]) {
  const head = `${orderCode}/BG.`;
  const max = existing.reduce((m, c) => (c.startsWith(head) && /^\d+$/.test(c.slice(head.length)) ? Math.max(m, Number(c.slice(head.length))) : m), 0);
  return `${head}${max + 1}`;
}

/** Tổng báo giá từ các dòng (số lượng × đơn giá), rồi giảm giá và thuế như giá trị đơn hàng. */
export function quoteItemsTotal(items: QuoteItem[], discountPct = 0, vatRate = 0) {
  const sub = items.reduce((s, i) => s + Math.round((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0);
  return orderTotals(sub, discountPct, vatRate);
}

/** Dòng chi phí ngoài chỉ tiêu hay dùng khi báo giá quan trắc. */
export const EXTRA_COSTS = [
  { label: "Ăn ở", unit: "người × ngày" },
  { label: "Nhân công", unit: "ngày công" },
  { label: "Phương tiện đi lại", unit: "chuyến" },
  { label: "Viết và in báo cáo", unit: "trọn gói" },
] as const;

export const ORDER_DOC_KINDS = ["Biên bản lấy mẫu", "Biên bản thử nghiệm", "Phiếu kết quả", "Báo cáo hoàn thiện", "Khác"] as const;
export const LINE_KINDS = ["Phòng TN", "Hiện trường"] as const;

// ── Hiện trường, kế hoạch quan trắc, nhiều lần đo (GĐ7) ──────────────

export const PLAN_ITEM_KINDS = ["Thiết bị", "Vật tư – hóa chất", "Bảo quản"] as const;
export type PlanItemKind = (typeof PLAN_ITEM_KINDS)[number];

/** Điều kiện môi trường ghi khi lấy mẫu. */
export const ENV_FIELDS = [
  { key: "weather", label: "Thời tiết" },
  { key: "temperature", label: "Nhiệt độ (°C)" },
  { key: "humidity", label: "Độ ẩm (%)" },
  { key: "wind", label: "Gió (hướng, tốc độ)" },
  { key: "pressure", label: "Áp suất (hPa)" },
  { key: "note", label: "Ghi chú khác" },
] as const;
export type EnvConditions = Partial<Record<(typeof ENV_FIELDS)[number]["key"], string>>;

/**
 * Kết quả trung bình của các lần đo ("7,2", "<0,05", "KPH"); ô trống bỏ qua.
 * Tất cả KPH → KPH; mọi lần đều "<" → "<" giá trị lớn nhất; còn lại trung bình các số (lần "<x" tính bằng x).
 * Trả null khi chưa có lần đo nào hoặc có ô không phải số.
 */
export function averageReplicates(texts: string[]): { prefix: string; value: number; n: number } | null {
  const parsed = texts.map((t) => String(t ?? "").trim()).filter(Boolean).map(parseResultCell);
  if (!parsed.length || parsed.some((p) => !p)) return null;
  const ps = parsed as { prefix: string; value: number }[];
  if (ps.every((p) => p.prefix === "KPH")) return { prefix: "KPH", value: NaN, n: ps.length };
  const nums = ps.filter((p) => Number.isFinite(p.value));
  if (!nums.length) return { prefix: "KPH", value: NaN, n: ps.length };
  if (nums.every((p) => p.prefix === "<") && nums.length === ps.length) return { prefix: "<", value: Math.max(...nums.map((p) => p.value)), n: ps.length };
  const mean = nums.reduce((s, p) => s + p.value, 0) / nums.length;
  return { prefix: "", value: Math.round(mean * 1e6) / 1e6, n: ps.length };
}

/** Ô kết quả từ giá trị trung bình (dạng hiển thị trên lưới). */
export const cellText = (r: { prefix: string; value: number } | null) =>
  !r ? "" : r.prefix === "KPH" ? "KPH" : `${r.prefix}${String(r.value).replace(".", ",")}`;

// ── Trang chủ: biểu đồ 6 tháng, lịch quan trắc tự động (GĐ8) ─────────

/** `n` tháng gần nhất tính đến tháng của `todayISO`, cũ → mới: { key: "2026-06", label: "T6/2026" }. */
export function lastMonths(todayISO: string, n: number) {
  const y = Number(todayISO.slice(0, 4));
  const m = Number(todayISO.slice(5, 7)) - 1;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - (n - 1 - i), 1));
    const mm = d.getUTCMonth() + 1;
    return { key: `${d.getUTCFullYear()}-${String(mm).padStart(2, "0")}`, label: `T${mm}/${d.getUTCFullYear()}` };
  });
}

export type MonthStack = { series: string[]; months: { key: string; label: string; counts: Record<string, number>; total: number }[] };

/**
 * Gom số đếm theo tháng × nhóm cho biểu đồ cột chồng. Thứ tự nhóm cố định theo `order` (màu theo nhóm, không theo thứ hạng);
 * nhóm ngoài `order` hoặc vượt `max` nhóm gộp vào "Khác".
 */
export function stackByMonth(rows: { month: string; key: string; n?: number }[], months: { key: string; label: string }[], order: string[], max = 7): MonthStack {
  const used = order.filter((k) => rows.some((r) => r.key === k && months.some((m) => m.key === r.month)));
  const keep = used.length > max ? used.slice(0, max - 1) : used;
  const other = "Khác";
  const bucket = (k: string) => (keep.includes(k) ? k : other);
  const series = [...keep, ...(rows.some((r) => months.some((m) => m.key === r.month) && bucket(r.key) === other) ? [other] : [])];
  return {
    series,
    months: months.map((m) => {
      const counts: Record<string, number> = Object.fromEntries(series.map((s) => [s, 0]));
      for (const r of rows) if (r.month === m.key) counts[bucket(r.key)] += r.n ?? 1;
      return { ...m, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
    }),
  };
}

export type PlanLike = { orderId: string; leader: string; supervisor: string; deputy1: string; deputy2: string; groups: string[][]; startAt: string; endAt: string };
export type OrderLike = { id: string; code: string; name: string; status: string; fieldAt: string; dueAt: string; fieldStaff: string };
export type FieldDuty = { staffName: string; day: string; kind: "Kế hoạch quan trắc"; title: string; orderId: string };

/**
 * Lịch quan trắc tự sinh trong [from, to]: mỗi người trong đoàn (kế hoạch quan trắc) mỗi ngày từ ngày đi đến ngày về;
 * đơn chưa lập kế hoạch thì người phụ trách quan trắc vào ngày quan trắc. Bỏ đơn đã hủy / thanh lý; tối đa 31 ngày mỗi đơn.
 */
export function fieldDuties(plans: PlanLike[], orders: OrderLike[], from: string, to: string): FieldDuty[] {
  const out: FieldDuty[] = [];
  for (const o of orders) {
    if (o.status === "Hủy" || o.status === "Thanh lý") continue;
    const p = plans.find((x) => x.orderId === o.id && x.startAt);
    const start = (p?.startAt ?? o.fieldAt).slice(0, 10);
    if (!start) continue;
    const end = p ? (p.endAt || p.startAt).slice(0, 10) : start;
    const people = p
      ? [...new Set([p.leader, p.supervisor, p.deputy1, p.deputy2, ...p.groups.flat()].map((s) => s?.trim()).filter(Boolean))]
      : o.fieldStaff ? [o.fieldStaff] : [];
    if (!people.length) continue;
    for (let day = start, i = 0; day <= end && i < 31; day = addDays(day, 1), i++) {
      if (day < from || day > to) continue;
      for (const staffName of people) out.push({ staffName, day, kind: "Kế hoạch quan trắc", title: o.name, orderId: o.id });
    }
  }
  return out;
}

export type OrderEvent = { day: string; kind: "Quan trắc" | "Trả kết quả"; orderId: string; code: string; name: string };

/** Mốc theo đơn hàng trong [from, to]: ngày đi quan trắc / lấy mẫu (đơn chưa qua phân tích) và hạn trả kết quả (đơn chưa trả). */
export function orderEvents(orders: OrderLike[], from: string, to: string): OrderEvent[] {
  const out: OrderEvent[] = [];
  for (const o of orders) {
    const f = o.fieldAt.slice(0, 10);
    const d = o.dueAt.slice(0, 10);
    if (f && f >= from && f <= to && (o.status === "Báo giá" || o.status === "Quan trắc")) out.push({ day: f, kind: "Quan trắc", orderId: o.id, code: o.code, name: o.name });
    if (d && d >= from && d <= to && o.status !== "Trả kết quả" && o.status !== "Thanh lý" && o.status !== "Hủy") out.push({ day: d, kind: "Trả kết quả", orderId: o.id, code: o.code, name: o.name });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || a.code.localeCompare(b.code));
}
