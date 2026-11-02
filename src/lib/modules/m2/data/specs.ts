// Cột quy chuẩn theo XaLab: chọn Quy chuẩn (danh mục Quy chuẩn) → tên quy chuẩn và loại mẫu lấy theo quy chuẩn đó.
import { standardStore } from "@/lib/modules/m2/data/catalogs";
import { analyteStore, specLimitStore, specificationStore, type Specification } from "@/lib/modules/m2/data/orders";
import type { SpecRow } from "@/lib/modules/m2/spec-rows";

/** Điền tên quy chuẩn (cột `name` cũ) và loại mẫu từ Quy chuẩn đã chọn; chưa chọn thì giữ như cũ. */
export async function withStandard<T extends Partial<Specification>>(b: T): Promise<T> {
  if (!b.standardId) return b;
  const std = (await standardStore.list()).find((s) => s.id === b.standardId);
  if (!std) return b;
  return { ...b, name: std.name, ...(std.sampleTypeId ? { sampleTypeId: std.sampleTypeId } : {}) };
}

/**
 * Các dòng của lưới: mọi chỉ tiêu (theo tên) của loại mẫu của cột, kèm giới hạn đã nhập;
 * giới hạn của chỉ tiêu không còn trong danh mục vẫn giữ ở cuối.
 */
export async function specRows(spec: Specification): Promise<SpecRow[]> {
  const [analytes, limits] = await Promise.all([analyteStore.list(), specLimitStore.list()]);
  const mine = limits.filter((l) => l.specId === spec.id);
  const byName = new Map(mine.map((l) => [l.analyte.toLowerCase(), l]));
  const seen = new Set<string>();
  const rows: SpecRow[] = [];
  const push = (analyte: string, unit: string) => {
    const k = analyte.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    const l = byName.get(k);
    rows.push({ analyte, unit, minValue: l?.minValue ?? null, maxValue: l?.maxValue ?? null, notDetected: l?.notDetected ?? false, ndText: l?.ndText ?? "", printNote: l?.printNote ?? "", printText: l?.printText ?? "" });
  };
  analytes
    .filter((a) => a.active && (!spec.sampleTypeId || a.sampleTypeId === spec.sampleTypeId))
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "vi", { numeric: true }))
    .forEach((a) => push(a.name, a.unit));
  mine.sort((a, b) => a.analyte.localeCompare(b.analyte, "vi")).forEach((l) => push(l.analyte, ""));
  return rows;
}

export const specById = async (id: string) => (await specificationStore.list()).find((s) => s.id === id);
