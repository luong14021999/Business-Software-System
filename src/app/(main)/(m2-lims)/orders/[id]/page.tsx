import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { OrderForm } from "@/components/m2/orders/order-form";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { orderDocumentStore } from "@/lib/modules/m2/data/order-extras";
import { orderFormData } from "@/lib/modules/m2/data/order-form-data";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, documents, data] = await Promise.all([orderStore.list(), orderDocumentStore.list(), orderFormData()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  return (
    <LabPage title={order.name} rule={false}>
      <OrderForm
        order={order}
        {...data}
        documents={documents.filter((d) => d.orderId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
      />
    </LabPage>
  );
}
