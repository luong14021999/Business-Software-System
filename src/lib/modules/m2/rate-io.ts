// Xuất / nhập bảng giá (CSV): Loại mẫu, Chỉ tiêu, Đơn giá, Giá vốn.
import { normalizeVi } from "@/lib/platform/format";
import { cellNumber } from "@/lib/modules/m2/spec-rows";

export const RATE_COLUMNS = ["Loại mẫu", "Chỉ tiêu", "Đơn giá", "Giá vốn"] as const;
export type RateRow = { type: string; analyte: string; amount: number | null; cost: number | null };

/** Số tiền trong ô: bỏ dấu chấm / khoảng trắng ngăn nghìn ("1.250.000" → 1250000). */
export const money = (s: string) => cellNumber(String(s ?? "").replace(/[.\s](?=\d{3}(\D|$))/g, "").replace(/đ/g, ""));

export function readRateRows(table: string[][]): { rows: RateRow[]; errors: string[] } {
  const hi = table.findIndex((r) => r.some((c) => normalizeVi(c) === normalizeVi("Chỉ tiêu")) && r.some((c) => normalizeVi(c) === normalizeVi("Đơn giá")));
  if (hi < 0) return { rows: [], errors: ['Không tìm thấy dòng tiêu đề có cột "Chỉ tiêu" và "Đơn giá" – dùng file Xuất Excel của bảng giá làm mẫu'] };
  const col = new Map(table[hi].map((c, i) => [normalizeVi(c), i]));
  const get = (r: string[], name: string) => String(r[col.get(normalizeVi(name)) ?? -1] ?? "").trim();
  const rows: RateRow[] = [];
  const errors: string[] = [];
  table.slice(hi + 1).forEach((r, i) => {
    const analyte = get(r, "Chỉ tiêu");
    if (!analyte) return;
    const amount = money(get(r, "Đơn giá"));
    const cost = money(get(r, "Giá vốn"));
    if (Number.isNaN(amount) || Number.isNaN(cost)) return void errors.push(`Dòng ${hi + i + 2} (${analyte}): đơn giá / giá vốn không phải số`);
    rows.push({ type: get(r, "Loại mẫu"), analyte, amount, cost });
  });
  return { rows, errors };
}
