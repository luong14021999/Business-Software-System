import { QuotePage } from "@/components/m2/orders/quote-page";
import { pageGate } from "@/components/m2/lab-ui/page-gate";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const denied = await pageGate("view.finance");
  if (denied) return denied;
  return <QuotePage orderId={(await params).id} kind="before" />;
}
