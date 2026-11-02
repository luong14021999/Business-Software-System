import { LabPage } from "@/components/m2/lab-ui/page";
import { OrderForm } from "@/components/m2/orders/order-form";
import { orderFormData } from "@/lib/modules/m2/data/order-form-data";
import { orderStore } from "@/lib/modules/m2/data/orders";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ copy?: string }> }) {
  const { copy } = await searchParams;
  const copyFrom = copy ? (await orderStore.list()).find((o) => o.id === copy) : undefined;
  return (
    <LabPage title="Tạo đơn hàng" rule={false}>
      <OrderForm {...await orderFormData()} copyFrom={copyFrom} />
    </LabPage>
  );
}
