// Chỉ tiêu phụ (như XaLab): bóc tách một chỉ tiêu chính thì tự thêm các chỉ tiêu phụ đã khai báo.
import { normalizeVi } from "@/lib/platform/format";

export type LineItem = { name: string; unit?: string; method?: string; subcontractor?: string; samplingTimes?: number; lineKind?: string };
type Analyte = { id: string; name: string; sampleTypeId: string; unit: string; method: string };
type Mapping = { sampleTypeId: string; mainAnalyteId: string; method: string; accessoryIds: string[] };

/**
 * Thêm chỉ tiêu phụ ngay sau chỉ tiêu chính của loại mẫu `sampleTypeId`.
 * Khai báo có phương pháp thì chỉ áp khi dòng chính dùng đúng phương pháp đó; bỏ qua chỉ tiêu đã có trong danh sách.
 */
export function expandAccessories(lines: LineItem[], sampleTypeId: string, analytes: Analyte[], mappings: Mapping[]): LineItem[] {
  const byId = new Map(analytes.map((a) => [a.id, a]));
  const mainOf = new Map(analytes.filter((a) => a.sampleTypeId === sampleTypeId).map((a) => [normalizeVi(a.name), a]));
  const seen = new Set(lines.map((l) => normalizeVi(l.name)));
  const out: LineItem[] = [];
  for (const l of lines) {
    out.push(l);
    const main = mainOf.get(normalizeVi(l.name));
    if (!main) continue;
    const method = normalizeVi(l.method ?? "");
    for (const m of mappings) {
      if (m.mainAnalyteId !== main.id || (m.sampleTypeId && m.sampleTypeId !== sampleTypeId)) continue;
      if (m.method && normalizeVi(m.method) !== method) continue;
      for (const id of m.accessoryIds) {
        const a = byId.get(id);
        if (!a || seen.has(normalizeVi(a.name))) continue;
        seen.add(normalizeVi(a.name));
        out.push({ name: a.name, unit: a.unit, method: a.method, subcontractor: l.subcontractor, lineKind: l.lineKind });
      }
    }
  }
  return out;
}
