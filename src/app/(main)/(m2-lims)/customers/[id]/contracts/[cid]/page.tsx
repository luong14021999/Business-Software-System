import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { customerProfileStore } from "@/lib/modules/m2/data/customers";
import { contractStore } from "@/lib/modules/m2/data/catalogs";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { contractFields } from "@/lib/modules/m2/customer-forms";

export const dynamic = "force-dynamic";

export default async function EditContractPage({ params }: { params: Promise<{ id: string; cid: string }> }) {
  const denied = await pageGate("view.finance");
  if (denied) return denied;
  const { id, cid } = await params;
  const [ctx, customers, contracts] = await Promise.all([customerContext(id), customerProfileStore.list(), contractStore.list()]);
  const c = contracts.find((x) => x.id === cid && x.customerId === id);
  if (!ctx || !c) notFound();
  return (
    <XFormPage
      title={c.contractNo}
      subtitle="Thông tin hợp đồng"
      fields={contractFields(customers.sort((a, b) => a.name.localeCompare(b.name, "vi")).map((x) => ({ value: x.id, label: x.name })))}
      initial={c}
      id={cid}
      endpoint="/api/customer-contracts"
      backHref={`/customers/${id}/contracts`}
      canWrite={ctx.canWrite}
    />
  );
}
