import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { SuppliesEditor } from "@/components/m2/orders/order-subform";
import { analyteStore, orderLines, orderSampleStore, orderStore } from "@/lib/modules/m2/data/orders";
import { planItemStore } from "@/lib/modules/m2/data/order-extras";
import { samplingContainerStore } from "@/lib/modules/m2/data/catalogs";
import { analyteResourceStore } from "@/lib/modules/m2/data/settings";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Vật tư – hóa chất của đơn hàng: dụng cụ lấy mẫu theo loại, số chỉ tiêu của đơn cần dụng cụ đó. */
export default async function OrderSuppliesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, containers, items, lines, samples, analytes, resources] = await Promise.all([
    orderStore.list(),
    samplingContainerStore.list(),
    planItemStore.list(),
    orderLines(id),
    orderSampleStore.list(),
    analyteStore.list(),
    analyteResourceStore.list(),
  ]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  // Chỉ tiêu (theo loại mẫu của mẫu + tên) → tên các dụng cụ lấy mẫu gắn ở tab "Dụng cụ lấy mẫu" của chỉ tiêu.
  const typeOf = new Map(samples.filter((s) => s.orderId === id).map((s) => [s.code, s.sampleTypeId]));
  const need = new Map<string, number>();
  for (const l of lines) {
    const a = analytes.find((x) => x.sampleTypeId === typeOf.get(l.sampleCode) && normalizeVi(x.name) === normalizeVi(l.criterion));
    if (!a) continue;
    for (const r of resources.filter((x) => x.analyteId === a.id && x.kind === "container")) need.set(r.name, (need.get(r.name) ?? 0) + 1);
  }
  return (
    <LabPage title={order.name} subtitle={<span className="text-lg text-[#333]">Vật tư - hóa chất</span>}>
      <SuppliesEditor
        orderId={id}
        catalog={containers
          .sort((a, b) => (a.containerType || "Khác").localeCompare(b.containerType || "Khác", "vi") || a.name.localeCompare(b.name, "vi"))
          .map((c) => ({ name: c.name, unit: c.unit, group: c.containerType || "Khác", needed: need.get(c.name) ?? 0 }))}
        initial={items.filter((i) => i.orderId === id && i.kind === "Vật tư – hóa chất").map((i) => ({ name: i.name, quantity: i.quantity }))}
      />
    </LabPage>
  );
}
