import { LabPage } from "@/components/m2/lab-ui/page";
import { OrderForm } from "@/components/m2/orders/order-form";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { contactStore, locationStore } from "@/lib/modules/m2/data/order-extras";
import { staffStore } from "@/lib/modules/m2/data/staff";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const [customers, staff, contacts, locations] = await Promise.all([getCustomers(), staffStore.list(), contactStore.list(), locationStore.list()]);
  return (
    <LabPage title="Thêm đơn hàng">
      <OrderForm customers={customers.map((c) => ({ id: c.id, name: c.name }))} staff={staff.map((s) => s.fullName).filter(Boolean)} contacts={contacts} locations={locations} />
    </LabPage>
  );
}
