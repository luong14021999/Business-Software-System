// Hàm thuần của nhóm Quản lý (thiết bị, hóa chất) – không truy cập CSDL để kiểm thử được.

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const diffDays = (a: string, b: string) => Math.round((Date.parse(`${a.slice(0, 10)}T00:00:00Z`) - Date.parse(`${b.slice(0, 10)}T00:00:00Z`)) / 86_400_000);

/** Hạn hiệu chuẩn tiếp theo: lần định kỳ gần nhất + tần suất (ngày); thiếu thì dùng hạn đã ghi sẵn. */
export function nextCalibrationDue(lastPeriodic: string, days: number | null | undefined, fallback = "") {
  if (lastPeriodic && days && days > 0) return addDays(lastPeriodic, days);
  return fallback ? fallback.slice(0, 10) : "";
}

export type DueState = "qua-han" | "hom-nay" | "sap" | "";

/** Trạng thái hạn hiệu chuẩn so với hôm nay: quá hạn, đến hạn hôm nay, sắp đến hạn (trong `soon` ngày). */
export function calibrationState(due: string, today: string, soon = 30): DueState {
  if (!due) return "";
  const d = diffDays(due, today);
  if (d < 0) return "qua-han";
  if (d === 0) return "hom-nay";
  return d <= soon ? "sap" : "";
}

/** Các tháng (1–12) đến hạn hiệu chuẩn trong năm, lặp theo tần suất từ lần định kỳ gần nhất. */
export function dueMonths(year: number, lastPeriodic: string, days: number | null | undefined, fallback = ""): number[] {
  const months = new Set<number>();
  const y = String(year);
  if (lastPeriodic && days && days > 0) {
    let d = addDays(lastPeriodic, days);
    for (let i = 0; i < 400 && d.slice(0, 4) <= y; i++, d = addDays(d, days)) {
      if (d.startsWith(y)) months.add(Number(d.slice(5, 7)));
    }
  } else if (fallback.startsWith(y)) {
    months.add(Number(fallback.slice(5, 7)));
  }
  return [...months].sort((a, b) => a - b);
}

export type LotState = "Còn hàng" | "Hết hàng" | "Đã tiêu hủy" | "Quá hạn";

/** Tình trạng một dòng tồn kho hóa chất. */
export function lotState(l: { remaining: number; disposed: boolean; expiry: string }, today: string): LotState {
  if (l.disposed) return "Đã tiêu hủy";
  if (l.remaining <= 0) return "Hết hàng";
  if (l.expiry && l.expiry.slice(0, 10) < today) return "Quá hạn";
  return "Còn hàng";
}

/** Cảnh báo tồn kho: quá hạn, sắp hết hạn (trong `soon` ngày), sắp hết (còn ≤ 10% lượng nhập). */
export function lotAlerts(l: { remaining: number; disposed: boolean; expiry: string; qtyIn: number }, today: string, soon = 30) {
  const live = !l.disposed && l.remaining > 0;
  const exp = l.expiry ? diffDays(l.expiry, today) : null;
  return {
    expired: live && exp !== null && exp < 0,
    expiring: live && exp !== null && exp >= 0 && exp <= soon,
    low: live && l.qtyIn > 0 && l.remaining <= l.qtyIn * 0.1,
  };
}

export type CalibrationFilter = { eq?: string; mode?: string; ifrom?: string; ito?: string; pfrom?: string; pto?: string };
const within = (d: string | undefined, from?: string, to?: string) => Boolean(d) && (!from || d!.slice(0, 10) >= from) && (!to || d!.slice(0, 10) <= to);

/** Lọc lịch sử hiệu chuẩn như XaLab: theo thiết bị, theo khoảng ngày nội bộ (mode noi-bo) hoặc định kỳ (dinh-ky), hay toàn bộ. */
export function filterCalibrations<T extends { equipmentId?: string; internalDate?: string; date: string }>(logs: T[], f: CalibrationFilter): T[] {
  return logs
    .filter((l) => l.equipmentId && (!f.eq || l.equipmentId === f.eq))
    .filter((l) => (f.mode === "noi-bo" ? within(l.internalDate, f.ifrom, f.ito) : f.mode === "dinh-ky" ? within(l.date, f.pfrom, f.pto) : true))
    .sort((a, b) => (b.date || b.internalDate || "").localeCompare(a.date || a.internalDate || ""));
}
