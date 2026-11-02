import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { LabPage, btn, btnXs, link, table } from "@/components/m2/lab-ui/page";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { NewQuoteButton } from "@/components/m2/orders/new-quote-button";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { orderQuoteStore } from "@/lib/modules/m2/data/order-extras";
import { canTouchOrder } from "@/lib/modules/m2/data/order-access";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateTimeVN } from "@/lib/platform/dates";

/** Danh sách báo giá của đơn hàng như XaLab (sau bóc tách) hoặc "báo giá độc lập" (trước bóc tách). */
export async function QuotePage({ orderId, kind }: { orderId: string; kind: "after" | "before" }) {
  const [orders, quotes, access] = await Promise.all([orderStore.list(), orderQuoteStore.list(), currentAccess()]);
  const order = orders.find((o) => o.id === orderId);
  if (!order) notFound();
  const canWrite = access.can("write.sales") && (await canTouchOrder(orderId, "sales"));
  const rows = quotes.filter((q) => q.orderId === orderId && q.kind === kind).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <LabPage
      title={kind === "after" ? `Danh sách báo giá của ${order.name}` : `Danh sách báo giá độc lập của ${order.name}`}
      rule={false}
      toolbar={
        <div className="flex">
          <Link href="/orders" className={`${btn} ${canWrite ? "rounded-r-none" : ""}`} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
          {canWrite && <NewQuoteButton orderId={orderId} kind={kind} className={`${btn} -ml-px rounded-l-none`} />}
        </div>
      }
    >
      <table className={table}>
        <thead><tr><th>Số báo giá</th><th>Ngày báo giá</th><th /><th /></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Chưa có báo giá</td></tr>}
          {rows.map((q) => (
            <tr key={q.id}>
              <td>
                <Link href={`/orders/${orderId}/quote/${q.id}`} className={link}>{q.code}</Link>
                {q.code === order.quoteNo && <span className="ml-2 text-xs text-[#3c763d]">(giá trị đơn hàng)</span>}
              </td>
              <td>{fmtDateTimeVN(q.quotedAt)}</td>
              <td>{canWrite && <XDeleteLink url={`/api/order-quotes/${q.id}`} label={q.code} />}</td>
              <td><Link href={`/order-print/${orderId}?loai=bao-gia&v=${q.id}`} className={btnXs}>In ấn <Printer className="h-3 w-3" aria-hidden /></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </LabPage>
  );
}
