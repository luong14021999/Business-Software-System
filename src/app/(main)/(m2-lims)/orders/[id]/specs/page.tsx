import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { TypeSpecs } from "@/components/m2/orders/type-specs";
import { orderSampleStore, orderStore, sampleTypeStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { orderTypeSpecStore } from "@/lib/modules/m2/data/order-extras";
import { specLabel } from "@/lib/modules/m2/orders";

export const dynamic = "force-dynamic";

/** Danh sách quy chuẩn theo loại mẫu của đơn hàng. */
export default async function OrderSpecsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, samples, types, specs, typeSpecs] = await Promise.all([orderStore.list(), orderSampleStore.list(), sampleTypeStore.list(), specificationStore.list(), orderTypeSpecStore.list()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const mine = samples.filter((s) => s.orderId === id);
  const rows = types
    .filter((t) => mine.some((s) => s.sampleTypeId === t.id))
    .map((t) => {
      const ts = typeSpecs.find((x) => x.orderId === id && x.sampleTypeId === t.id);
      return { sampleTypeId: t.id, typeName: t.name, prefix: t.prefix, samples: mine.filter((s) => s.sampleTypeId === t.id).length, spec1Id: ts?.spec1Id ?? "", spec2Id: ts?.spec2Id ?? "" };
    });
  return (
    <LabPage
      title="Danh sách quy chuẩn theo loại mẫu"
      subtitle={`Đơn hàng ${order.code} · ${order.name}`}
      toolbar={<Link href={`/orders/${id}`} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>}
    >
      <TypeSpecs orderId={id} rows={rows} specs={specs.filter((s) => s.active).map((s) => ({ id: s.id, label: specLabel(s), sampleTypeId: s.sampleTypeId }))} />
    </LabPage>
  );
}
