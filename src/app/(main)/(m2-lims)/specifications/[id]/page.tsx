import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { analyteStore, specLimitStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { specLabel, specLimitText } from "@/lib/modules/m2/orders";
import { DeriveSpec } from "@/components/m2/settings/derive-spec";
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
    { name: "notDetected", label: "Quy chuẩn ghi dạng chữ", type: "bool", boolLabels: ["Có (KPH, Không mùi…)", "Không – giới hạn số"], defaultValue: 0 },
    { name: "ndText", label: "Chữ in ở cột quy chuẩn", placeholder: "VD: KPH, 0, Không mùi" },
    { name: "printNote", label: "Ghi chú khi in", full: true },
    { name: "note", label: "Ghi chú nội bộ", placeholder: "VD: đơn vị mg/L" },
  ];
  return (
    <LabPage
      title={`Chỉ tiêu của quy chuẩn ${specLabel(spec)}`}
      subtitle="Bỏ trống tối thiểu hoặc tối đa nếu quy chuẩn chỉ quy định một phía. Tối thiểu = tối đa = 0 → in “-” (không quy định). Quy chuẩn dạng chữ (KPH, Không mùi) → đánh dấu “Quy chuẩn ghi dạng chữ”."
      toolbar={
        <>
          <Link href="/specifications" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          {canWrite && <EntityFormDialog mode="add" endpoint="/api/specification-limits" title="Thêm giới hạn" fields={[...fields, { name: "specId", label: "", type: "select", options: [{ value: spec.id, label: spec.name }], defaultValue: spec.id }]} trigger={<button type="button" className={btn}>Thêm chỉ tiêu +</button>} />}
        </>
      }
    >
      {canWrite && (
        <div className="mb-4">
          <DeriveSpec specId={spec.id} sources={specs.filter((x) => x.id !== spec.id).map((x) => ({ id: x.id, label: specLabel(x) }))} />
        </div>
      )}
      <CatalogTable
        entity="specification-limits"
        canWrite={canWrite}
        fields={fields}
        emptyText="Chưa nhập giới hạn chỉ tiêu nào"
        headers={["Chỉ tiêu", "Giới hạn (in trên phiếu)", "Ghi chú khi in", "Ghi chú nội bộ"]}
        rows={limits.filter((l) => l.specId === id).sort((a, b) => a.analyte.localeCompare(b.analyte)).map((l) => ({
          id: l.id,
          label: l.analyte,
          initial: l,
          cells: [l.analyte, specLimitText(l), l.printNote, l.note],
        }))}
      />
    </LabPage>
  );
}
