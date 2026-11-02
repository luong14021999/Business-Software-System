import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { FieldImport } from "@/components/m2/orders/field-import";
import { orderStore } from "@/lib/modules/m2/data/orders";

export const dynamic = "force-dynamic";

/** Nhập dữ liệu hiện trường của đơn hàng từ file. */
export default async function FieldImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = (await orderStore.list()).find((o) => o.id === id);
  if (!order) notFound();
  return (
    <LabPage title="Upload file Excel" subtitle={`Nhập dữ liệu hiện trường · ${order.code} – ${order.name}`}>
      <FieldImport orderId={id} templateUrl={`/api/orders/${id}/field-template`} />
    </LabPage>
  );
}
