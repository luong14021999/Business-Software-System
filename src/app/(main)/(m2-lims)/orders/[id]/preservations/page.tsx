import { notFound } from "next/navigation";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { PreservationGrid } from "@/components/m2/orders/order-subform";
import { orderSampleStore, orderStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { samplePreservationStore } from "@/lib/modules/m2/data/order-extras";
import { preservationStore } from "@/lib/modules/m2/data/settings";

export const dynamic = "force-dynamic";

/** Bảo quản của đơn hàng: lọc theo loại mẫu, tích cách bảo quản cho từng mẫu. */
export default async function OrderPreservationsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [orders, samples, types, preservations, cells] = await Promise.all([orderStore.list(), orderSampleStore.list(), sampleTypeStore.list(), preservationStore.list(), samplePreservationStore.list()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const mine = samples.filter((s) => s.orderId === id).sort((a, b) => a.code.localeCompare(b.code));
  const usedTypes = types.filter((t) => mine.some((s) => s.sampleTypeId === t.id)).sort((a, b) => a.sort - b.sort);
  const typeId = usedTypes.some((t) => t.id === sp.type) ? sp.type! : usedTypes[0]?.id ?? "";
  const ofType = mine.filter((s) => s.sampleTypeId === typeId);
  return (
    <LabPage
      title={`Bảo quản của đơn hàng: ${order.name}`}
      toolbar={
        usedTypes.length > 0 && (
          <Dropdown filter className={`${btn} text-base`} label={`Loại mẫu: ${usedTypes.find((t) => t.id === typeId)?.name ?? ""}`} items={usedTypes.map((t) => ({ label: t.name, href: `/orders/${id}/preservations?type=${t.id}`, active: t.id === typeId }))} />
        )
      }
    >
      {usedTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Đơn hàng chưa có yêu cầu – bóc tách trước.</p>
      ) : (
        <PreservationGrid
          key={typeId}
          orderId={id}
          sampleTypeId={typeId}
          samples={ofType.map((s) => ({ id: s.id, code: s.code, customerCode: s.customerSampleCode }))}
          preservations={preservations.filter((p) => !p.sampleTypeId || p.sampleTypeId === typeId).sort((a, b) => a.name.localeCompare(b.name, "vi")).map((p) => ({ id: p.id, name: p.name }))}
          initial={cells.filter((c) => ofType.some((s) => s.id === c.sampleId)).map((c) => `${c.sampleId}|${c.preservationId}`)}
        />
      )}
    </LabPage>
  );
}
