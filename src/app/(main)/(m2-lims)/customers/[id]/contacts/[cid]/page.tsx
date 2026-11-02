import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { contactStore } from "@/lib/modules/m2/data/order-extras";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { CONTACT_FIELDS } from "@/lib/modules/m2/customer-forms";

export const dynamic = "force-dynamic";

export default async function EditContactPage({ params }: { params: Promise<{ id: string; cid: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const { id, cid } = await params;
  const [ctx, contacts] = await Promise.all([customerContext(id), contactStore.list()]);
  const c = contacts.find((x) => x.id === cid && x.customerId === id);
  if (!ctx || !c) notFound();
  return <XFormPage title={c.name} subtitle="Thông tin liên lạc" fields={CONTACT_FIELDS} initial={c} id={cid} endpoint="/api/customer-contacts" backHref={`/customers/${id}/contacts`} canWrite={ctx.canWrite} />;
}
