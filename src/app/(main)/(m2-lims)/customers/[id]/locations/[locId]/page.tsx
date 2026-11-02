import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { LOCATION_FIELDS } from "@/lib/modules/m2/customer-forms";

export const dynamic = "force-dynamic";

/** Sửa địa điểm của khách hàng. */
export default async function EditLocationPage({ params }: { params: Promise<{ id: string; locId: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const { id, locId } = await params;
  const ctx = await customerContext(id, locId);
  if (!ctx?.location) notFound();
  return <XFormPage title={ctx.location.name} subtitle="Thông tin địa điểm" fields={LOCATION_FIELDS} initial={ctx.location} id={locId} endpoint="/api/customer-locations" backHref={`/customers/${id}/locations`} canWrite={ctx.canWrite} />;
}
