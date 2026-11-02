import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { ScheduleEditor } from "@/components/m2/customers/schedule-editor";
import { locationScheduleStore } from "@/lib/modules/m2/data/catalogs";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";

export const dynamic = "force-dynamic";

/** Lịch quan trắc định kỳ ở một địa điểm của khách hàng. */
export default async function SchedulesPage({ params }: { params: Promise<{ id: string; locId: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const { id, locId } = await params;
  const [ctx, schedules] = await Promise.all([customerContext(id, locId), locationScheduleStore.list()]);
  if (!ctx?.location) notFound();
  const rows = schedules
    .filter((s) => s.locationId === locId)
    .sort((a, b) => (a.fieldMonth ?? 0) - (b.fieldMonth ?? 0) || (a.fieldDay ?? 0) - (b.fieldDay ?? 0))
    .map((s) => ({ fieldDay: String(s.fieldDay ?? ""), fieldMonth: String(s.fieldMonth ?? "") }));
  return (
    <LabPage title={`Lịch quan trắc ở ${ctx.location.name}`} rule={false}>
      <ScheduleEditor locationId={locId} initial={rows} backHref={`/customers/${id}/locations`} canWrite={ctx.canWrite} />
    </LabPage>
  );
}
