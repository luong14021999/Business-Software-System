import { PriceToolsPage } from "@/components/m2/settings/rate-pages";
import { pageGate } from "@/components/m2/lab-ui/page-gate";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return (await pageGate("view.finance")) ?? <PriceToolsPage id={(await params).id} />;
}
