import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { PlanEditor } from "@/components/m2/orders/plan-editor";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { planItemStore, planOf } from "@/lib/modules/m2/data/order-extras";
import { containerTypeStore, preservationStore } from "@/lib/modules/m2/data/settings";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Lập kế hoạch quan trắc của đơn hàng. */
export default async function OrderPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, plan, items, staff, equipment, containers, preservations, access] = await Promise.all([
    orderStore.list(),
    planOf(id),
    planItemStore.list(),
    staffStore.list(),
    equipmentStore.list(),
    containerTypeStore.list(),
    preservationStore.list(),
    currentAccess(),
  ]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  return (
    <LabPage
      title="Kế hoạch quan trắc"
      subtitle={`Đơn hàng ${order.code} · ${order.name}${plan?.updatedBy ? ` · cập nhật bởi ${plan.updatedBy}` : ""}`}
      toolbar={
        <>
          <Link href={`/orders/${id}`} className={btn} aria-label="Quay lại đơn hàng"><ArrowLeft className="h-4 w-4" /></Link>
          <Link href={`/order-print/${id}?loai=ke-hoach`} className={btn}>In kế hoạch</Link>
          <Link href={`/orders/${id}/assign`} className={btn}>Phân công</Link>
        </>
      }
    >
      <PlanEditor
        orderId={id}
        plan={plan}
        items={items.filter((i) => i.orderId === id).sort((a, b) => a.sort - b.sort)}
        staff={staff.map((s) => s.fullName).filter(Boolean)}
        canWrite={access.can("write.reception")}
        catalog={{
          "Thiết bị": equipment.sort((a, b) => Number(b.isField) - Number(a.isField)).map((e) => `${e.code} · ${e.name}`),
          "Vật tư – hóa chất": containers.map((c) => c.name),
          "Bảo quản": preservations.map((p) => p.name),
        }}
      />
    </LabPage>
  );
}
