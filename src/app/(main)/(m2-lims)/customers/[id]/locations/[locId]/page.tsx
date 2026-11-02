import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { locationStore, pointStore } from "@/lib/modules/m2/data/order-extras";
import { currentAccess } from "@/lib/platform/data/access";
import { pageGate } from "@/components/m2/lab-ui/page-gate";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Tên vị trí quan trắc", required: true, full: true, placeholder: "VD: Nước sông Chu tại điểm xả thải" },
  { name: "lat", label: "Vĩ độ (X)", type: "number", nullable: true },
  { name: "lng", label: "Kinh độ (Y)", type: "number", nullable: true },
  { name: "description", label: "Mô tả", type: "textarea" },
];

export default async function PointsPage({ params }: { params: Promise<{ id: string; locId: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const { id, locId } = await params;
  const [locations, points, access] = await Promise.all([locationStore.list(), pointStore.list(), currentAccess()]);
  const loc = locations.find((x) => x.id === locId && x.customerId === id);
  if (!loc) notFound();
  const canWrite = access.can("write.reception");
  return (
    <LabPage
      title="Vị trí quan trắc"
      subtitle={loc.name}
      toolbar={
        <>
          <Link href={`/customers/${id}/locations`} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          {canWrite && <EntityFormDialog mode="add" endpoint="/api/monitoring-points" title="Thêm vị trí quan trắc" fields={[...FIELDS, { name: "locationId", label: "Địa điểm", type: "select", options: [{ value: locId, label: loc.name }], defaultValue: locId }]} trigger={<button type="button" className={btn}>Thêm +</button>} />}
        </>
      }
    >
      <CatalogTable
        entity="monitoring-points"
        canWrite={canWrite}
        fields={FIELDS}
        emptyText="Chưa có vị trí quan trắc"
        headers={["Tên vị trí", "Vĩ độ (X)", "Kinh độ (Y)", "Mô tả"]}
        rows={points.filter((p) => p.locationId === locId).sort((a, b) => a.name.localeCompare(b.name, "vi")).map((p) => ({ id: p.id, label: p.name, initial: p, cells: [p.name, p.lat ?? "—", p.lng ?? "—", p.description] }))}
      />
    </LabPage>
  );
}
