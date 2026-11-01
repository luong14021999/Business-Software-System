import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { LabPage, btn, table } from "@/components/m2/lab-ui/page";
import { QuoteForm } from "@/components/m2/orders/quote-form";
import { orderLines, orderStore } from "@/lib/modules/m2/data/orders";
import { priceResolver, rateListStore } from "@/lib/modules/m2/data/settings";
import { quoteLines } from "@/lib/modules/m2/orders";
import { fmtVND } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Báo giá của đơn hàng: bảng kê theo chỉ tiêu (số mẫu × đơn giá tham khảo) và giá trị chốt với khách. */
export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, lines, lists] = await Promise.all([orderStore.list(), orderLines(id), rateListStore.list()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const q = quoteLines(lines, await priceResolver(order.priceListId));
  const priceLists = lists.filter((l) => l.kind === "price" && (l.active || l.id === order.priceListId)).map((l) => ({ id: l.id, name: l.name }));
  const suggested = q.reduce((s, l) => s + l.amount, 0);
  const missing = q.filter((l) => !l.unitPrice).length;
  return (
    <LabPage
      title={`Báo giá đơn hàng ${order.name}`}
      subtitle={`Đơn hàng ${order.code} · ${order.status}`}
      toolbar={
        <>
          <Link href={`/orders/${id}`} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          <Link href={`/order-print/${id}?loai=bao-gia`} target="_blank" className={btn}><Printer className="h-4 w-4" />In báo giá</Link>
          <Link href={`/orders/${id}/debit`} className={btn}>Công nợ</Link>
        </>
      }
    >
      <h2 className="text-xl font-medium">Bảng kê theo chỉ tiêu</h2>
      <div className="mt-2 overflow-x-auto">
        <table className={table}>
          <thead><tr><th>#</th><th>Chỉ tiêu</th><th>Đơn vị</th><th className="text-right">Số mẫu</th><th className="text-right">Đơn giá</th><th className="text-right">Thành tiền</th></tr></thead>
          <tbody>
            {q.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Đơn hàng chưa có chỉ tiêu – bóc tách trước khi lập báo giá</td></tr>}
            {q.map((l, i) => (
              <tr key={`${l.criterion}-${i}`}>
                <td>{i + 1}</td><td>{l.criterion}</td><td>{l.unit || "-"}</td>
                <td className="text-right">{l.samples}</td>
                <td className={`text-right ${l.unitPrice ? "" : "text-[#a94442]"}`}>{l.unitPrice ? fmtVND(l.unitPrice) : "chưa có giá"}</td>
                <td className="text-right">{fmtVND(l.amount)}</td>
              </tr>
            ))}
            {q.length > 0 && <tr><td colSpan={5} className="text-right font-bold">Cộng</td><td className="text-right font-bold">{fmtVND(suggested)}</td></tr>}
          </tbody>
        </table>
      </div>
      {missing > 0 && <p className="mt-1 text-xs text-[#a94442]">{missing} chỉ tiêu chưa có giá – nhập ở Cài đặt → Bảng giá (hoặc đơn giá tham khảo của chỉ tiêu), hoặc điền giá trị đơn hàng bằng tay.</p>}
      <h2 className="mt-6 text-xl font-medium">Giá trị đơn hàng</h2>
      <div className="mt-3">
        <QuoteForm orderId={id} suggested={suggested} priceLists={priceLists} initial={{ priceListId: order.priceListId, quoteNo: order.quoteNo, quotedAt: order.quotedAt, amount: order.amount, discountPct: order.discountPct, vatRate: order.vatRate }} />
      </div>
    </LabPage>
  );
}
