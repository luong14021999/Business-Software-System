import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { ResultsGrid, type GridSample } from "@/components/m2/orders/results-grid";
import { analyteStore, orderLines, orderSampleStore, orderStore, specLimitStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { specLabel } from "@/lib/modules/m2/orders";
import { normalizeVi } from "@/lib/platform/format";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

export default async function OrderResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, samples, lines, specs, limits, analytes, access] = await Promise.all([
    orderStore.list(),
    orderSampleStore.list(),
    orderLines(id),
    specificationStore.list(),
    specLimitStore.list(),
    analyteStore.list(),
    currentAccess(),
  ]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const spec = new Map(specs.map((s) => [s.id, s]));
  // Giới hạn theo quy chuẩn của mẫu, khớp tên chỉ tiêu không phân biệt dấu / hoa thường.
  const limitOf = (specId: string, criterion: string) => limits.find((x) => x.specId === specId && normalizeVi(x.analyte) === normalizeVi(criterion));
  const grid: GridSample[] = samples
    .filter((s) => s.orderId === id)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((s) => ({
      code: s.code,
      locationName: s.locationName,
      type: s.type,
      stage: s.stage,
      specName: spec.get(s.specId) ? specLabel(spec.get(s.specId)!) : "",
      lines: lines
        .filter((l) => l.sampleCode === s.code)
        .map((l) => {
          const lim = s.specId ? limitOf(s.specId, l.criterion) : undefined;
          return {
            id: l.id,
            criterion: l.criterion,
            unit: l.unit,
            text: l.prefix === "KPH" ? "KPH" : Number.isFinite(l.mean) ? `${l.prefix}${String(l.mean).replace(".", ",")}` : "",
            method: l.method,
            subcontractor: l.subcontractor,
            status: l.status,
            technician: l.technician,
            min: lim?.minValue ?? null,
            max: lim?.maxValue ?? null,
          };
        }),
    }));
  const methods = [...new Set(analytes.map((a) => a.method).filter(Boolean))].sort();
  return (
    <LabPage title="Nhập/duyệt kết quả thử nghiệm" subtitle={`Đơn hàng ${order.code} · ${order.name}`} wide>
      <ResultsGrid
        orderId={id}
        samples={grid}
        can={{ enter: access.can("results.enter"), qa: access.can("results.qa"), approve: access.can("results.approve") }}
        me={{ name: access.actor?.name ?? "", email: access.actor?.email ?? "" }}
        methods={methods}
      />
    </LabPage>
  );
}
