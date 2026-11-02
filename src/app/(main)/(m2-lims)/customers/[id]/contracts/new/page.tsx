import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { customerProfileStore } from "@/lib/modules/m2/data/customers";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { contractFields } from "@/lib/modules/m2/customer-forms";

export const dynamic = "force-dynamic";

export default async function NewContractPage({ params }: { params: Promise<{ id: string }> }) {
  const denied = await pageGate("view.finance");
  if (denied) return denied;
  const { id } = await params;
  const [ctx, customers] = await Promise.all([customerContext(id), customerProfileStore.list()]);
  if (!ctx) notFound();
  const base = `/customers/${id}/contracts`;
  return (
    <XFormPage
      title="Tạo hợp đồng"
      subtitle="Thông tin hợp đồng"
      fields={contractFields(customers.sort((a, b) => a.name.localeCompare(b.name, "vi")).map((c) => ({ value: c.id, label: c.name })))}
      initial={{ customerId: id, value: 0 }}
      endpoint="/api/customer-contracts"
      backHref={base}
      editBase={base}
      canWrite={ctx.canWrite}
    />
  );
}
