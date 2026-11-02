import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { LOCATION_FIELDS } from "@/lib/modules/m2/customer-forms";

export const dynamic = "force-dynamic";

export default async function NewLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const { id } = await params;
  const ctx = await customerContext(id);
  if (!ctx) notFound();
  const base = `/customers/${id}/locations`;
  return <XFormPage title="Tạo địa điểm" subtitle="Thông tin địa điểm" fields={LOCATION_FIELDS} initial={{}} extra={{ customerId: id }} endpoint="/api/customer-locations" backHref={base} editBase={base} canWrite={ctx.canWrite} />;
}
