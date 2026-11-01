import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { analyteStore, specLimitStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { limitText, specLabel } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

export default async function SpecificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [specs, limits, analytes, access] = await Promise.all([specificationStore.list(), specLimitStore.list(), analyteStore.list(), currentAccess()]);
  const spec = specs.find((s) => s.id === id);
  if (!spec) notFound();
  const canWrite = access.can("write.quality");
  const names = [...new Set(analytes.filter((a) => !spec.sampleTypeId || a.sampleTypeId === spec.sampleTypeId).map((a) => a.name))].sort();
  const fields: CrudField[] = [
    { name: "analyte", label: "Chỉ tiêu", required: true, full: true, type: names.length ? "select" : "text", options: names },
    { name: "minValue", label: "Giới hạn tối thiểu", type: "number", nullable: true },
    { name: "maxValue", label: "Giới hạn tối đa", type: "number", nullable: true },
    { name: "note", label: "Ghi chú", placeholder: "VD: đơn vị mg/L" },
  ];
  return (
    <LabPage
      title={`Chỉ tiêu của quy chuẩn ${specLabel(spec)}`}
      subtitle="Bỏ trống tối thiểu hoặc tối đa nếu quy chuẩn chỉ quy định một phía; khớp chỉ tiêu theo tên (không phân biệt dấu, hoa thường)"
      toolbar={
        <>
          <Link href="/specifications" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          {canWrite && <EntityFormDialog mode="add" endpoint="/api/specification-limits" title="Thêm giới hạn" fields={[...fields, { name: "specId", label: "", type: "select", options: [{ value: spec.id, label: spec.name }], defaultValue: spec.id }]} trigger={<button type="button" className={btn}>Thêm chỉ tiêu +</button>} />}
        </>
      }
    >
      <CatalogTable
        entity="specification-limits"
        canWrite={canWrite}
        fields={fields}
        emptyText="Chưa nhập giới hạn chỉ tiêu nào"
        headers={["Chỉ tiêu", "Giới hạn", "Ghi chú"]}
        rows={limits.filter((l) => l.specId === id).sort((a, b) => a.analyte.localeCompare(b.analyte)).map((l) => ({
          id: l.id,
          label: l.analyte,
          initial: l,
          cells: [l.analyte, limitText(l.minValue, l.maxValue), l.note],
        }))}
      />
    </LabPage>
  );
}
