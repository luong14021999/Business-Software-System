import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { customerProfileStore } from "@/lib/modules/m2/data/customers";
import { departmentStore } from "@/lib/modules/m2/data/catalogs";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { customerFields } from "@/lib/modules/m2/customer-forms";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Sửa thông tin khách hàng (thêm ô Người tạo như XaLab). */
export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const [{ id }, customers, departments, staff, access] = await Promise.all([params, customerProfileStore.list(), departmentStore.list(), staffStore.list(), currentAccess()]);
  const c = customers.find((x) => x.id === id);
  if (!c) notFound();
  const staffOpts = staff.map((s) => s.fullName).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi")).map((n) => ({ value: n, label: n }));
  return (
    <XFormPage
      title={c.name}
      subtitle="Thông tin khách hàng"
      fields={[
        ...customerFields(departments.sort((a, b) => a.sort - b.sort).map((d) => ({ value: d.id, label: d.name })), staffOpts),
        { name: "active", label: "Đang giao dịch", type: "checkbox" },
      ]}
      initial={c}
      id={id}
      endpoint="/api/customer-profiles"
      backHref="/customers"
      canWrite={access.can("write.reception")}
    />
  );
}
