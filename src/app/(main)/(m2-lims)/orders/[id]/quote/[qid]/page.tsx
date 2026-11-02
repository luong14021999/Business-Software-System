import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { QuoteForm } from "@/components/m2/orders/quote-form";
import { analyteStore, orderStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { orderQuoteStore } from "@/lib/modules/m2/data/order-extras";
import { priceResolver, rateListStore } from "@/lib/modules/m2/data/settings";

export const dynamic = "force-dynamic";

/** Sửa một báo giá của đơn hàng (tiêu đề là số báo giá như XaLab). */
export default async function QuoteEditPage({ params }: { params: Promise<{ id: string; qid: string }> }) {
  const denied = await pageGate("view.finance");
  if (denied) return denied;
  const { id, qid } = await params;
  const [orders, quotes, lists, analytes, types] = await Promise.all([orderStore.list(), orderQuoteStore.list(), rateListStore.list(), analyteStore.list(), sampleTypeStore.list()]);
  const order = orders.find((o) => o.id === id);
  const quote = quotes.find((q) => q.id === qid && q.orderId === id);
  if (!order || !quote) notFound();
  const priceLists = lists.filter((l) => l.kind === "price" && l.active);
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const catalog = analytes.filter((a) => a.active).map((a) => ({ typeName: typeName.get(a.sampleTypeId) ?? "", analyte: a.name, unit: a.unit })).filter((c) => c.typeName);
  // Đơn giá theo từng bảng giá ("" = đơn giá tham khảo của chỉ tiêu) cho mọi cặp loại mẫu|chỉ tiêu.
  const prices: Record<string, Record<string, number>> = {};
  for (const listId of ["", ...priceLists.map((l) => l.id)]) {
    const resolve = await priceResolver(listId);
    prices[listId] = Object.fromEntries(catalog.map((c) => [`${c.typeName}|${c.analyte}`, resolve(c.typeName, c.analyte)]));
  }
  return (
    <LabPage title={quote.code}>
      <QuoteForm
        orderId={id}
        backHref={quote.kind === "before" ? `/orders/${id}/quote-before` : `/orders/${id}/quote`}
        quote={quote}
        priceLists={priceLists.map((l) => ({ id: l.id, name: l.name }))}
        prices={prices}
        catalog={catalog}
        applied={order.quoteNo === quote.code}
      />
    </LabPage>
  );
}
