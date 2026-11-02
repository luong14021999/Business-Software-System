import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { contactStore } from "@/lib/modules/m2/data/order-extras";
import { currentAccess } from "@/lib/platform/data/access";
import { pageGate } from "@/components/m2/lab-ui/page-gate";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Họ và tên", required: true },
  { name: "title", label: "Chức vụ" },
  { name: "phone", label: "Điện thoại" },
  { name: "email", label: "Email" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function ContactsPage({ params }: { params: Promise<{ id: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const { id } = await params;
  const [customers, contacts, access] = await Promise.all([getCustomers(), contactStore.list(), currentAccess()]);
  const c = customers.find((x) => x.id === id);
  if (!c) notFound();
  const canWrite = access.can("write.reception");
  return (
    <LabPage
      title={`Danh sách liên lạc của ${c.name}`}
      toolbar={
        <>
          <Link href="/customers" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          {canWrite && <EntityFormDialog mode="add" endpoint="/api/customer-contacts" title="Thêm người liên hệ" fields={[...FIELDS, { name: "customerId", label: "Khách hàng", type: "select", options: [{ value: id, label: c.name }], defaultValue: id }]} trigger={<button type="button" className={btn}>Thêm +</button>} />}
          <Link href={`/customers/${id}/locations`} className={btn}>Địa điểm</Link>
        </>
      }
    >
      <CatalogTable
        entity="customer-contacts"
        canWrite={canWrite}
        fields={FIELDS}
        emptyText="Chưa có người liên hệ"
        headers={["Họ và tên", "Chức vụ", "Điện thoại", "Email", "Ghi chú"]}
        rows={contacts.filter((x) => x.customerId === id).sort((a, b) => a.name.localeCompare(b.name, "vi")).map((x) => ({ id: x.id, label: x.name, initial: x, cells: [x.name, x.title, x.phone, x.email, x.note] }))}
      />
    </LabPage>
  );
}
