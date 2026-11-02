// Hàm định dạng, chuẩn hóa dùng chung giữa các phần mềm (thuần, kiểm thử được).

export const fmtVND = (v: number) => `${Math.round(Number(v) || 0).toLocaleString("vi-VN")} đ`;

/** Tỷ suất lợi nhuận trên doanh thu (%), 1 chữ số thập phân; chưa có giá hoặc chưa có định mức → null. */
export function marginPct(revenue: number, cost: number) {
  const r = Number(revenue) || 0;
  if (r <= 0 || !(Number(cost) > 0)) return null;
  return Math.round(((r - cost) / r) * 1000) / 10;
}

/** "YYYY-MM" của 12 tháng trong năm. */
export const monthsOf = (year: number) => Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

/** Cộng giá trị theo tháng "YYYY-MM" của trường ngày. */
export function sumByMonth<T>(items: T[], date: (x: T) => string, value: (x: T) => number, months: string[]) {
  const m = new Map(months.map((k) => [k, 0]));
  for (const x of items) {
    const k = (date(x) || "").slice(0, 7);
    if (m.has(k)) m.set(k, m.get(k)! + (Number(value(x)) || 0));
  }
  return months.map((k) => m.get(k)!);
}

/** Dòng CSV an toàn: bọc ngoặc kép, chặn công thức Excel (=, +, -, @ ở đầu). */
export function csvRow(cells: (string | number)[]) {
  return cells
    .map((c) => {
      let s = String(c ?? "");
      if (/^[=+\-@]/.test(s) && typeof c === "string") s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    })
    .join(",");
}

/** File CSV tải về (BOM UTF-8 để Excel đọc đúng tiếng Việt): dòng tiêu đề, dòng trống, bảng có cột TT. */
export function csvResponse(filename: string, title: string, columns: string[], rows: (string | number)[][]) {
  const lines = [csvRow([title]), "", csvRow(["TT", ...columns]), ...rows.map((r, i) => csvRow([i + 1, ...r]))];
  return new Response(`\uFEFF${lines.join("\r\n")}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.csv"` },
  });
}

/** Bỏ dấu tiếng Việt, chữ thường, chỉ giữ chữ – số. */
export function normalizeVi(s: string) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Chỉ cho phép liên kết http(s) trên trang công khai (chặn javascript:, data:…). */
export const safeUrl = (u: string) => (/^https?:\/\//i.test(u ?? "") ? u : "");

/** Chỉ giữ chữ số; +84 / 84 đầu số → 0. */
export function normalizePhone(v: string) {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.startsWith("84") && d.length >= 11 ? `0${d.slice(2)}` : d;
}

export const isValidPhone = (v: string) => /^0\d{9,10}$/.test(normalizePhone(v));
