import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { customerProfileStore } from "@/lib/modules/m2/data/customers";
import { departmentStore } from "@/lib/modules/m2/data/catalogs";
import { customerFields } from "@/lib/modules/m2/customer-forms";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Tạo khách hàng; "Copy" (?copy=id) điền sẵn thông tin của khách hàng khác, bỏ mã để tự sinh. */
export default async function NewCustomerPage({ searchParams }: { searchParams: Promise<{ copy?: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const [{ copy }, customers, departments, access] = await Promise.all([searchParams, customerProfileStore.list(), departmentStore.list(), currentAccess()]);
  const src = copy ? customers.find((c) => c.id === copy) : undefined;
  const initial: Record<string, unknown> = src ? { ...src, id: undefined, code: "", name: `${src.name} (bản sao)` } : { isRequestingUnit: false, isInspection: false };
  return (
    <XFormPage
      title="Tạo khách hàng"
      subtitle="Thông tin khách hàng"
      fields={customerFields(departments.sort((a, b) => a.sort - b.sort).map((d) => ({ value: d.id, label: d.name })), null)}
      initial={initial}
      endpoint="/api/customer-profiles"
      backHref="/customers"
      editBase="/customers"
      canWrite={access.can("write.reception")}
    />
  );
}
