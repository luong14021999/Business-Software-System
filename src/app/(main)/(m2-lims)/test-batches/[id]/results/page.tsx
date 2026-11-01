import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { ResultsGrid } from "@/components/m2/orders/results-grid";
import { analyteStore, batchLines, testBatchStore } from "@/lib/modules/m2/data/orders";
import { buildGrid } from "@/lib/modules/m2/data/grid";
import { scopeOptions } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

export default async function BatchResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [batches, lines, analytes, access] = await Promise.all([testBatchStore.list(), batchLines(id), analyteStore.list(), currentAccess()]);
  const batch = batches.find((b) => b.id === id);
  if (!batch) notFound();
  return (
    <LabPage title="Nhập/duyệt kết quả thử nghiệm" subtitle={`Mẻ ${batch.code} · ${batch.method || "chưa chọn phương pháp"} · ${batch.analyst}`} wide>
      <ResultsGrid
        saveUrl={`/api/test-batches/${id}/results`}
        backHref={`/test-batches/${id}`}
        samples={await buildGrid(lines)}
        scopes={await scopeOptions()}
        can={{ enter: access.can("results.enter"), qa: access.can("results.qa"), approve: access.can("results.approve") }}
        me={{ name: access.actor?.name ?? "", email: access.actor?.email ?? "" }}
        methods={[...new Set(analytes.map((a) => a.method).filter(Boolean))].sort()}
      />
    </LabPage>
  );
}
