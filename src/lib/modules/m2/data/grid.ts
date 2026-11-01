// Dựng dữ liệu lưới nhập/duyệt kết quả: nhóm dòng theo mẫu, gắn giới hạn quy chuẩn của mẫu.
import type { GridSample } from "@/components/m2/orders/results-grid";
import { orderSampleStore, specLimitStore, specificationStore, type OrderLine } from "@/lib/modules/m2/data/orders";
import { specLabel } from "@/lib/modules/m2/orders";
import { normalizeVi } from "@/lib/platform/format";

/** Ô kết quả hiển thị: "KPH", "<0,05", "7,25" hoặc trống. */
export const lineText = (l: Pick<OrderLine, "prefix" | "mean">) =>
  l.prefix === "KPH" ? "KPH" : Number.isFinite(l.mean) ? `${l.prefix}${String(l.mean).replace(".", ",")}` : "";

export async function buildGrid(lines: OrderLine[]): Promise<GridSample[]> {
  const [samples, specs, limits] = await Promise.all([orderSampleStore.list(), specificationStore.list(), specLimitStore.list()]);
  const byCode = new Map(samples.map((s) => [s.code, s]));
  const spec = new Map(specs.map((s) => [s.id, s]));
  // Khớp tên chỉ tiêu với giới hạn không phân biệt dấu / hoa thường.
  const limitOf = (specId: string, criterion: string) => limits.find((x) => x.specId === specId && normalizeVi(x.analyte) === normalizeVi(criterion));
  const codes = [...new Set(lines.map((l) => l.sampleCode))].sort();
  return codes.map((code) => {
    const s = byCode.get(code);
    const sp = s?.specId ? spec.get(s.specId) : undefined;
    return {
      code,
      locationName: s?.locationName ?? "",
      type: s?.type ?? "",
      stage: s?.stage ?? "",
      specName: sp ? specLabel(sp) : "",
      lines: lines
        .filter((l) => l.sampleCode === code)
        .map((l) => {
          const lim = sp ? limitOf(sp.id, l.criterion) : undefined;
          return {
            id: l.id,
            criterion: l.criterion,
            unit: l.unit,
            text: lineText(l),
            method: l.method,
            subcontractor: l.subcontractor,
            status: l.status,
            technician: l.technician,
            min: lim?.minValue ?? null,
            max: lim?.maxValue ?? null,
          };
        }),
    };
  });
}
