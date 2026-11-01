import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { SplitForm } from "@/components/m2/orders/split-form";
import { analyteStore, orderSampleStore, orderStore, sampleTypeStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { bulkTemplateStore, scopeOptions } from "@/lib/modules/m2/data/settings";

export const dynamic = "force-dynamic";

export default async function SplitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, types, analytes, specs, samples, templates, scopes] = await Promise.all([orderStore.list(), sampleTypeStore.list(), analyteStore.list(), specificationStore.list(), orderSampleStore.list(), bulkTemplateStore.list(), scopeOptions()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const mine = samples.filter((s) => s.orderId === id);
  const locations = [...new Set(mine.map((s) => s.locationName.replace(/ #\d+$/, "")).filter(Boolean))];
  return (
    <LabPage title="Bảng bóc tách" subtitle={`Đơn hàng ${order.code} · ${order.name} · đã có ${mine.length} yêu cầu`}>
      <SplitForm orderId={id} types={types.filter((t) => t.active).sort((a, b) => a.sort - b.sort)} analytes={analytes} specs={specs} locations={locations} templates={templates.sort((a, b) => a.name.localeCompare(b.name))} scopes={scopes} />
    </LabPage>
  );
}
