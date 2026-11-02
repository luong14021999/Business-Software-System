import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { pointStore } from "@/lib/modules/m2/data/order-extras";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { POINT_FIELDS } from "@/lib/modules/m2/customer-forms";

export const dynamic = "force-dynamic";

export default async function EditPointPage({ params }: { params: Promise<{ id: string; locId: string; pid: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const { id, locId, pid } = await params;
  const [ctx, points] = await Promise.all([customerContext(id, locId), pointStore.list()]);
  const p = points.find((x) => x.id === pid && x.locationId === locId);
  if (!ctx?.location || !p) notFound();
  return (
    <XFormPage
      title={p.name}
      subtitle="Thông tin vị trí lấy mẫu"
      fields={[...POINT_FIELDS, { name: "active", label: "Đang dùng", type: "checkbox" }]}
      initial={p}
      id={pid}
      endpoint="/api/monitoring-points"
      backHref={`/customers/${id}/locations/${locId}/points`}
      canWrite={ctx.canWrite}
    />
  );
}
