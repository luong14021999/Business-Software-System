// Dựng dữ liệu lưới nhập/duyệt kết quả: nhóm dòng theo mẫu, gắn giới hạn quy chuẩn của mẫu.
import type { GridSample } from "@/components/m2/orders/results-grid";
import { analyteStore, orderSampleStore, sampleTypeStore, specLimitStore, specificationStore, type OrderLine } from "@/lib/modules/m2/data/orders";
import { analyteMethodStore } from "@/lib/modules/m2/data/settings";
import { roundForPrint, specLabel, specLimitText } from "@/lib/modules/m2/orders";
import { normalizeVi } from "@/lib/platform/format";

/** Ô kết quả hiển thị: "KPH", "<0,05", "7,25" hoặc trống. */
export const lineText = (l: Pick<OrderLine, "prefix" | "mean">) =>
  l.prefix === "KPH" ? "KPH" : Number.isFinite(l.mean) ? `${l.prefix}${String(l.mean).replace(".", ",")}` : "";

export async function buildGrid(lines: OrderLine[]): Promise<GridSample[]> {
  const [samples, specs, limits, analytes, methods, types] = await Promise.all([
    orderSampleStore.list(),
    specificationStore.list(),
    specLimitStore.list(),
    analyteStore.list(),
    analyteMethodStore.list(),
    sampleTypeStore.list(),
  ]);
  const typeId = new Map(types.map((t) => [t.name, t.id]));
  // Giới hạn phát hiện của phương pháp: chỉ tiêu (loại mẫu + tên) → phương pháp của dòng.
  const analyteOf = (matrix: string, criterion: string) => analytes.find((x) => x.sampleTypeId === typeId.get(matrix) && normalizeVi(x.name) === normalizeVi(criterion));
  const methodRange = (matrix: string, criterion: string, method: string) => {
    const a = analyteOf(matrix, criterion);
    const m = a ? methods.find((x) => x.analyteId === a.id && x.method === method) : undefined;
    return { mMin: m?.minValue ?? null, mMax: m?.maxValue ?? null };
  };
  const printOf = (l: OrderLine) => {
    const a = analyteOf(l.matrix, l.criterion);
    const printText = l.prefix === "KPH" ? "KPH" : Number.isFinite(l.mean) ? `${l.prefix}${roundForPrint(l.mean, a?.decimals)}` : "";
    return { printName: a?.printName || l.criterion, printText };
  };
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
          // 0 – 0 = "không quy định"; quy chuẩn dạng chữ không so bằng số (chỉ KPH / 0 so với "không phát hiện").
          const numeric = lim && !lim.notDetected && !(lim.minValue === 0 && lim.maxValue === 0);
          const nd = lim?.notDetected ? (lim.ndText?.trim() || "KPH") : "";
          return {
            ...methodRange(l.matrix, l.criterion, l.method),
            ...printOf(l),
            limitLabel: lim ? specLimitText(lim) : "",
            ndRequired: nd === "KPH" || nd === "0",
            id: l.id,
            criterion: l.criterion,
            unit: l.unit,
            text: lineText(l),
            method: l.method,
            subcontractor: l.subcontractor,
            status: l.status,
            technician: l.technician,
            min: numeric ? (lim?.minValue ?? null) : null,
            max: numeric ? (lim?.maxValue ?? null) : null,
          };
        }),
    };
  });
}
