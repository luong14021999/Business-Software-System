import Link from "next/link";
import { notFound } from "next/navigation";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { SpecRowsGrid } from "@/components/m2/settings/spec-rows-grid";
import { specLimitStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { standardStore } from "@/lib/modules/m2/data/catalogs";
import { specRows } from "@/lib/modules/m2/data/specs";
import { specLabel } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Danh sách chỉ tiêu phân tích của một cột quy chuẩn (giới hạn từng chỉ tiêu) như XaLab. */
export default async function SpecificationRowsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [specs, limits, standards, access] = await Promise.all([specificationStore.list(), specLimitStore.list(), standardStore.list(), currentAccess()]);
  const spec = specs.find((s) => s.id === id);
  if (!spec) notFound();
  const canWrite = access.can("write.quality");
  const std = standards.find((s) => s.id === spec.standardId)?.name ?? spec.name;
  const rows = await specRows(spec);
  // Cột nguồn để "Tính toán": các cột cùng loại mẫu (hoặc chưa gắn loại mẫu) có giới hạn.
  const sources = specs
    .filter((s) => s.id !== id && (!spec.sampleTypeId || !s.sampleTypeId || s.sampleTypeId === spec.sampleTypeId))
    .map((s) => ({ id: s.id, label: specLabel(s), limits: limits.filter((l) => l.specId === s.id).map((l) => ({ analyte: l.analyte, minValue: l.minValue, maxValue: l.maxValue, notDetected: l.notDetected, ndText: l.ndText })) }))
    .filter((s) => s.limits.length)
    .sort((a, b) => a.label.localeCompare(b.label, "vi"));
  const exportUrl = `/api/specifications/${id}/rows`;
  return (
    <LabPage title={`Danh sách chỉ tiêu phân tích của ${std}${spec.columnName ? ` - ${spec.columnName}` : ""}`}>
      <div className="mb-[15px] flex flex-wrap gap-1">
        <a href={exportUrl} className={btn}>Xuất Excel</a>
        {canWrite && <Link href={`/specifications/${id}/import`} className={btn}>Nhập Excel</Link>}
      </div>
      <SpecRowsGrid specId={id} rows={rows} sources={sources} canWrite={canWrite} />
    </LabPage>
  );
}
