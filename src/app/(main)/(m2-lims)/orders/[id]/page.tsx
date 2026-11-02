import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { OrderForm } from "@/components/m2/orders/order-form";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { contactStore, locationStore, orderDocumentStore } from "@/lib/modules/m2/data/order-extras";
import { staffStore } from "@/lib/modules/m2/data/staff";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, customers, staff, contacts, locations, documents] = await Promise.all([
    orderStore.list(),
    getCustomers(),
    staffStore.list(),
    contactStore.list(),
    locationStore.list(),
    orderDocumentStore.list(),
  ]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  return (
    <LabPage title={order.name} subtitle={`Đơn hàng ${order.code} · ${order.status}`}>
      <OrderForm
        order={order}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        staff={staff.map((s) => s.fullName).filter(Boolean)}
        contacts={contacts}
        locations={locations}
        documents={documents.filter((d) => d.orderId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
      />
    </LabPage>
  );
}
