import { PriceGridPage } from "@/components/m2/settings/rate-pages";
import { pageGate } from "@/components/m2/lab-ui/page-gate";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  return (await pageGate("view.finance")) ?? <PriceGridPage id={(await params).id} type={(await searchParams).type} />;
}
