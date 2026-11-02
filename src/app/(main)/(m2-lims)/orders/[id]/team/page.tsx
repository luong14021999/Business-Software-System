import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { TeamEditor } from "@/components/m2/orders/order-subform";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { planOf } from "@/lib/modules/m2/data/order-extras";
import { staffStore } from "@/lib/modules/m2/data/staff";

export const dynamic = "force-dynamic";

/** Nhân sự quan trắc của đơn hàng. */
export default async function OrderTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, plan, staff] = await Promise.all([orderStore.list(), planOf(id), staffStore.list()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  return (
    <LabPage title={order.name} subtitle={<span className="text-lg text-[#333]">Nhân sự quan trắc</span>}>
      <TeamEditor
        orderId={id}
        staff={staff.map((s) => s.fullName).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"))}
        initial={{ leader: plan?.leader ?? "", supervisor: plan?.supervisor ?? "", deputy1: plan?.deputy1 ?? "", deputy2: plan?.deputy2 ?? "", groups: plan?.groups ?? [] }}
      />
    </LabPage>
  );
}
