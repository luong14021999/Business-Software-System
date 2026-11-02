import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { ResultsGrid } from "@/components/m2/orders/results-grid";
import { analyteStore, orderLines, orderStore } from "@/lib/modules/m2/data/orders";
import { buildGrid } from "@/lib/modules/m2/data/grid";
import { scopeOptions } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

export default async function OrderResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, lines, analytes, access] = await Promise.all([orderStore.list(), orderLines(id), analyteStore.list(), currentAccess()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const methods = [...new Set(analytes.map((a) => a.method).filter(Boolean))].sort();
  return (
    <LabPage title="Nhập/duyệt kết quả thử nghiệm" rule={false}>
      <ResultsGrid
        saveUrl={`/api/orders/${id}/results`}
        backHref={`/orders/${id}/samples`}
        samples={await buildGrid(lines)}
        scopes={await scopeOptions()}
        can={{ enter: access.can("results.enter"), qa: access.can("results.qa"), approve: access.can("results.approve") }}
        me={{ name: access.actor?.name ?? "", email: access.actor?.email ?? "" }}
        methods={methods}
      />
    </LabPage>
  );
}
