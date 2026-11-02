import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { TypeSpecForm } from "@/components/m2/orders/type-spec-form";
import { orderStore, sampleTypeStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { orderTypeSpecStore } from "@/lib/modules/m2/data/order-extras";
import { standardStore } from "@/lib/modules/m2/data/catalogs";
import { specLabel } from "@/lib/modules/m2/orders";

export const dynamic = "force-dynamic";

/** Bảng quy chuẩn của một loại mẫu trong đơn hàng. */
export default async function TypeSpecPage({ params }: { params: Promise<{ id: string; typeId: string }> }) {
  const { id, typeId } = await params;
  const [orders, types, standards, specs, typeSpecs] = await Promise.all([orderStore.list(), sampleTypeStore.list(), standardStore.list(), specificationStore.list(), orderTypeSpecStore.list()]);
  const order = orders.find((o) => o.id === id);
  const type = types.find((t) => t.id === typeId);
  if (!order || !type) notFound();
  const ts = typeSpecs.find((x) => x.orderId === id && x.sampleTypeId === typeId);
  // Bản ghi cũ chỉ có cột 1, 2 → coi như danh sách cột.
  const specIds = ts?.specIds?.length ? ts.specIds : [ts?.spec1Id ?? "", ts?.spec2Id ?? ""].filter(Boolean);
  return (
    <LabPage title={`Bảng quy chuẩn của ${type.name}`} rule={false}>
      <TypeSpecForm
        orderId={id}
        sampleTypeId={typeId}
        standards={standards.filter((s) => s.active && (!s.sampleTypeId || s.sampleTypeId === typeId)).sort((a, b) => a.name.localeCompare(b.name, "vi")).map((s) => ({ id: s.id, name: s.name }))}
        columns={specs.filter((s) => s.active && (!s.sampleTypeId || s.sampleTypeId === typeId)).map((s) => ({ id: s.id, name: specLabel(s), standardId: s.standardId }))}
        initial={{ standardIds: ts?.standardIds ?? [], specIds }}
      />
    </LabPage>
  );
}
