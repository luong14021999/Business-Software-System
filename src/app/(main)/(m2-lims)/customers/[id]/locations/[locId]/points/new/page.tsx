import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { POINT_FIELDS } from "@/lib/modules/m2/customer-forms";

export const dynamic = "force-dynamic";

export default async function NewPointPage({ params }: { params: Promise<{ id: string; locId: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const { id, locId } = await params;
  const ctx = await customerContext(id, locId);
  if (!ctx?.location) notFound();
  const base = `/customers/${id}/locations/${locId}/points`;
  return (
    <XFormPage
      title={`Tạo mới vị trí lấy mẫu của ${ctx.location.name}`}
      subtitle="Thông tin vị trí lấy mẫu"
      fields={POINT_FIELDS}
      initial={{ sort: 0, lat: null, lng: null }}
      extra={{ locationId: locId, active: true }}
      endpoint="/api/monitoring-points"
      backHref={base}
      editBase={base}
      canWrite={ctx.canWrite}
    />
  );
}
