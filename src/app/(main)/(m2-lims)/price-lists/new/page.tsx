import { RateFormPage } from "@/components/m2/settings/rate-pages";
import { pageGate } from "@/components/m2/lab-ui/page-gate";

export const dynamic = "force-dynamic";

export default async function Page() {
  return (await pageGate("view.finance")) ?? <RateFormPage kind="price" />;
}
