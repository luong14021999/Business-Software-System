import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { FieldImport } from "@/components/m2/orders/field-import";
import { testBatchStore } from "@/lib/modules/m2/data/orders";

export const dynamic = "force-dynamic";

/** Nhập Excel kết quả cho các chỉ tiêu trong mẻ thử nghiệm. */
export default async function BatchImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batch = (await testBatchStore.list()).find((b) => b.id === id);
  if (!batch) notFound();
  return (
    <LabPage title="Upload file Excel" subtitle={`Nhập kết quả mẻ ${batch.code}`}>
      <FieldImport batchId={id} templateUrl={`/api/test-batches/${id}/template`} backHref="/test-batches" doneHref={`/test-batches/${id}/results`} />
    </LabPage>
  );
}
