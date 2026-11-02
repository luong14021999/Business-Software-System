import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { CONTACT_FIELDS } from "@/lib/modules/m2/customer-forms";

export const dynamic = "force-dynamic";

export default async function NewContactPage({ params }: { params: Promise<{ id: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const { id } = await params;
  const ctx = await customerContext(id);
  if (!ctx) notFound();
  const base = `/customers/${id}/contacts`;
  return <XFormPage title="Tạo liên lạc" subtitle="Thông tin liên lạc" fields={CONTACT_FIELDS} initial={{ salutation: "Ông" }} extra={{ customerId: id }} endpoint="/api/customer-contacts" backHref={base} editBase={base} canWrite={ctx.canWrite} />;
}
