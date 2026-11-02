import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { QuoteEditor, type EditItem } from "@/components/m2/orders/quote-editor";
import { analyteStore, orderLines, orderStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { orderQuoteStore } from "@/lib/modules/m2/data/order-extras";
import { priceResolver, rateListStore } from "@/lib/modules/m2/data/settings";
import { quoteLines } from "@/lib/modules/m2/orders";

/** Trang báo giá dùng chung: sau bóc tách (bảng kê từ chỉ tiêu đã bóc tách) hoặc trước bóc tách (tự chọn). */
export async function QuotePage({ orderId, kind }: { orderId: string; kind: "after" | "before" }) {
  const [orders, lines, lists, analytes, types, quotes] = await Promise.all([
    orderStore.list(),
    orderLines(orderId),
    rateListStore.list(),
    analyteStore.list(),
    sampleTypeStore.list(),
    orderQuoteStore.list(),
  ]);
  const order = orders.find((o) => o.id === orderId);
  if (!order) notFound();
  const priceLists = lists.filter((l) => l.kind === "price" && l.active);
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const catalog = analytes.filter((a) => a.active).map((a) => ({ typeName: typeName.get(a.sampleTypeId) ?? "", analyte: a.name, unit: a.unit })).filter((c) => c.typeName);
  // Đơn giá theo từng bảng giá ("" = đơn giá tham khảo của chỉ tiêu) cho mọi cặp loại mẫu|chỉ tiêu.
  const prices: Record<string, Record<string, number>> = {};
  for (const id of ["", ...priceLists.map((l) => l.id)]) {
    const resolve = await priceResolver(id);
    prices[id] = Object.fromEntries(catalog.map((c) => [`${c.typeName}|${c.analyte}`, resolve(c.typeName, c.analyte)]));
  }
  const resolve = await priceResolver(order.priceListId);
  const initialItems: EditItem[] =
    kind === "after"
      ? quoteLines(lines, resolve).map((q) => ({ key: `${q.matrix}|${q.criterion}`, label: q.criterion, unit: "mẫu", quantity: q.samples, unitPrice: q.unitPrice, group: q.matrix }))
      : [];
  const versions = quotes.filter((q) => q.orderId === orderId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <LabPage
      title={kind === "after" ? `Báo giá đơn hàng ${order.name}` : `Báo giá trước bóc tách – ${order.name}`}
      subtitle={`Đơn hàng ${order.code} · ${kind === "after" ? "bảng kê lấy từ chỉ tiêu đã bóc tách" : "khách chỉ gửi khối lượng – chọn loại mẫu, chỉ tiêu, số lượng"}`}
      wide
      toolbar={
        <>
          <Link href={`/orders/${orderId}`} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          <Link href={kind === "after" ? `/orders/${orderId}/quote-before` : `/orders/${orderId}/quote`} className={btn}>{kind === "after" ? "Báo giá trước bóc tách" : "Báo giá sau bóc tách"}</Link>
          <Link href={`/orders/${orderId}/debit`} className={btn}>Công nợ</Link>
        </>
      }
    >
      <QuoteEditor
        orderId={orderId}
        kind={kind}
        initialItems={initialItems}
        priceLists={priceLists.map((l) => ({ id: l.id, name: l.name }))}
        prices={prices}
        catalog={catalog}
        versions={versions}
        defaults={{ discountPct: order.discountPct, vatRate: order.vatRate }}
        appliedCode={order.quoteNo}
      />
    </LabPage>
  );
}
