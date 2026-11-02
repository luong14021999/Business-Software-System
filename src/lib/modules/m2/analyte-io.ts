// Xuất / nhập danh sách chỉ tiêu (file CSV mở bằng Excel) – cột cố định, dòng đầu là tiêu đề.
import { normalizeVi } from "@/lib/platform/format";

export const ANALYTE_COLUMNS = [
  "Loại mẫu", "Tên", "Tên tiếng Anh", "Tên khi in", "Viết tắt", "Đơn vị", "Nhóm chỉ tiêu", "Phương pháp phân tích",
  "Phương pháp lấy mẫu", "Thứ tự", "Chỉ tiêu hiện trường", "Phạm vi thực hiện", "LOQ", "Đơn giá", "Ghi chú",
] as const;

export type AnalyteRow = {
  type: string; name: string; englishName: string; printName: string; abbreviation: string; unit: string; groupName: string; method: string;
  samplingMethod: string; sort: number; isField: boolean; scope: string; loq: string; unitPrice: number; note: string;
};

const num = (s: string) => Number(String(s ?? "").replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")) || 0;

/** Đọc bảng CSV: tìm dòng tiêu đề (có "Loại mẫu" và "Tên"), ghép cột theo tên; trả các dòng hợp lệ và lỗi từng dòng. */
export function readAnalyteRows(table: string[][]): { rows: AnalyteRow[]; errors: string[] } {
  const hi = table.findIndex((r) => r.some((c) => normalizeVi(c) === normalizeVi("Loại mẫu")) && r.some((c) => normalizeVi(c) === normalizeVi("Tên")));
  if (hi < 0) return { rows: [], errors: ["Không tìm thấy dòng tiêu đề có cột \"Loại mẫu\" và \"Tên\" – dùng file mẫu tải từ trang Xuất Excel"] };
  const col = new Map(table[hi].map((c, i) => [normalizeVi(c), i]));
  const get = (r: string[], name: string) => String(r[col.get(normalizeVi(name)) ?? -1] ?? "").trim();
  const rows: AnalyteRow[] = [];
  const errors: string[] = [];
  table.slice(hi + 1).forEach((r, i) => {
    if (r.every((c) => !String(c ?? "").trim())) return;
    const type = get(r, "Loại mẫu");
    const name = get(r, "Tên");
    if (!type || !name) return void errors.push(`Dòng ${hi + i + 2}: thiếu loại mẫu hoặc tên chỉ tiêu`);
    const field = normalizeVi(get(r, "Chỉ tiêu hiện trường"));
    rows.push({
      type, name,
      englishName: get(r, "Tên tiếng Anh"), printName: get(r, "Tên khi in"), abbreviation: get(r, "Viết tắt"), unit: get(r, "Đơn vị"),
      groupName: get(r, "Nhóm chỉ tiêu"), method: get(r, "Phương pháp phân tích"), samplingMethod: get(r, "Phương pháp lấy mẫu"),
      sort: num(get(r, "Thứ tự")), isField: ["x", "co", "1", "true"].includes(field), scope: get(r, "Phạm vi thực hiện"),
      loq: get(r, "LOQ"), unitPrice: num(get(r, "Đơn giá")), note: get(r, "Ghi chú"),
    });
  });
  return { rows, errors };
}
