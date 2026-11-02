// Lưới chỉ tiêu của một cột quy chuẩn (như trang "Danh sách chỉ tiêu phân tích của <quy chuẩn>" của XaLab).
import { normalizeVi } from "@/lib/platform/format";

export type SpecRow = { analyte: string; unit: string; minValue: number | null; maxValue: number | null; notDetected: boolean; ndText: string; printNote: string; printText: string };

export const SPEC_ROW_COLUMNS = ["Chỉ tiêu phân tích", "Đơn vị", "Giá trị tối thiểu", "Giá trị tối đa", "Không phát hiện", "Ghi chú không phát hiện", "Ghi chú khi in", "Giá trị khi in"] as const;

/** Dòng không có giới hạn nào (để xóa khỏi cột quy chuẩn khi lưu). */
export const emptyRow = (r: SpecRow) => r.minValue == null && r.maxValue == null && !r.notDetected && !r.ndText.trim() && !r.printNote.trim() && !r.printText.trim();

/** Số trong ô: "1,5" / "1.5" / "" → 1.5 / null; không phải số → NaN. */
export function cellNumber(s: string): number | null {
  const t = String(s ?? "").trim().replace(/\s/g, "");
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

/** Đọc file nhập (cột như file xuất); trả dòng hợp lệ và lỗi từng dòng. */
export function readSpecRows(table: string[][]): { rows: SpecRow[]; errors: string[] } {
  const hi = table.findIndex((r) => r.some((c) => normalizeVi(c) === normalizeVi("Chỉ tiêu phân tích")));
  if (hi < 0) return { rows: [], errors: ['Không tìm thấy dòng tiêu đề có cột "Chỉ tiêu phân tích" – dùng file Xuất Excel của cột quy chuẩn làm mẫu'] };
  const col = new Map(table[hi].map((c, i) => [normalizeVi(c), i]));
  const get = (r: string[], name: string) => String(r[col.get(normalizeVi(name)) ?? -1] ?? "").trim();
  const rows: SpecRow[] = [];
  const errors: string[] = [];
  table.slice(hi + 1).forEach((r, i) => {
    const analyte = get(r, "Chỉ tiêu phân tích");
    if (!analyte) return;
    const minValue = cellNumber(get(r, "Giá trị tối thiểu"));
    const maxValue = cellNumber(get(r, "Giá trị tối đa"));
    if (Number.isNaN(minValue) || Number.isNaN(maxValue)) return void errors.push(`Dòng ${hi + i + 2} (${analyte}): giá trị tối thiểu / tối đa không phải số`);
    rows.push({
      analyte,
      unit: get(r, "Đơn vị"),
      minValue,
      maxValue,
      notDetected: ["x", "co", "1", "true"].includes(normalizeVi(get(r, "Không phát hiện"))),
      ndText: get(r, "Ghi chú không phát hiện"),
      printNote: get(r, "Ghi chú khi in"),
      printText: get(r, "Giá trị khi in"),
    });
  });
  return { rows, errors };
}
