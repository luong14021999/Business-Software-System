import { RateListPage } from "@/components/m2/settings/rate-pages";
import { pageGate } from "@/components/m2/lab-ui/page-gate";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  const denied = await pageGate("view.finance");
  if (denied) return denied;
  const [{ id }, { type }] = await Promise.all([params, searchParams]);
  return <RateListPage kind="price" id={id} typeFilter={type} />;
}
