import { QuotePage } from "@/components/m2/orders/quote-page";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <QuotePage orderId={(await params).id} kind="after" />;
}
