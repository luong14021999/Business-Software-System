import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { locationStore, pointStore } from "@/lib/modules/m2/data/order-extras";
import { currentAccess } from "@/lib/platform/data/access";
import { pageGate } from "@/components/m2/lab-ui/page-gate";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Tên địa điểm / địa chỉ", required: true, full: true },
  { name: "oldName", label: "Tên địa điểm trước 1/7/2025", full: true, placeholder: "Địa chỉ theo đơn vị hành chính cũ (nếu khác)" },
  { name: "description", label: "Mô tả", type: "textarea" },
];

export default async function LocationsPage({ params }: { params: Promise<{ id: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const { id } = await params;
  const [customers, locations, points, access] = await Promise.all([getCustomers(), locationStore.list(), pointStore.list(), currentAccess()]);
  const c = customers.find((x) => x.id === id);
  if (!c) notFound();
  const canWrite = access.can("write.reception");
  return (
    <LabPage
      title={`Danh sách địa điểm của ${c.name}`}
      subtitle="Một khách hàng có thể có nhiều địa điểm quan trắc; mỗi địa điểm có các vị trí quan trắc (điểm đo)"
      toolbar={
        <>
          <Link href="/customers" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          {canWrite && <EntityFormDialog mode="add" endpoint="/api/customer-locations" title="Thêm địa điểm" fields={[...FIELDS, { name: "customerId", label: "Khách hàng", type: "select", options: [{ value: id, label: c.name }], defaultValue: id }]} trigger={<button type="button" className={btn}>Thêm +</button>} />}
          <Link href={`/customers/${id}/contacts`} className={btn}>Liên hệ</Link>
        </>
      }
    >
      <CatalogTable
        entity="customer-locations"
        canWrite={canWrite}
        fields={FIELDS}
        emptyText="Chưa có địa điểm"
        headers={["Tên địa điểm", "Tên địa điểm trước 1/7/2025", "Mô tả", "Vị trí quan trắc"]}
        rows={locations.filter((x) => x.customerId === id).map((x) => ({
          id: x.id,
          label: x.name,
          initial: x,
          cells: [x.name, x.oldName, x.description, points.filter((p) => p.locationId === x.id).length],
          extra: <Link href={`/customers/${id}/locations/${x.id}`} className="text-xs text-[#337ab7] hover:underline">Vị trí quan trắc</Link>,
        }))}
      />
    </LabPage>
  );
}
