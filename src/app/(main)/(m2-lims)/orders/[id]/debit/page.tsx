import { notFound } from "next/navigation";
import { LabPage } from "@/components/m2/lab-ui/page";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { DebitEditor } from "@/components/m2/orders/debit-editor";
import { orderPaymentStore, orderStore } from "@/lib/modules/m2/data/orders";
import { canTouchOrder } from "@/lib/modules/m2/data/order-access";
import { orderTotals } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Cài đặt thanh toán: giá trị đơn hàng (đã gồm VAT, giảm giá), các đợt thanh toán, số tiền còn lại. */
export default async function DebitPage({ params }: { params: Promise<{ id: string }> }) {
  const denied = await pageGate("view.finance");
  if (denied) return denied;
  const { id } = await params;
  const [orders, payments, access] = await Promise.all([orderStore.list(), orderPaymentStore.list(), currentAccess()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const mine = payments.filter((p) => p.orderId === id).sort((a, b) => (a.paidAt || "").localeCompare(b.paidAt || ""));
  const t = orderTotals(order.amount, order.discountPct, order.vatRate);
  const canWrite = access.can("write.sales") && (await canTouchOrder(id, "sales"));
  return (
    <LabPage title={`Cài đặt thanh toán ${order.name}`}>
      <div className="mb-5 rounded border border-[#bce8f1] bg-[#d9edf7] px-[15px] py-3 text-[#31708f]">
        <div className="text-lg font-medium">Giá trị đơn hàng: {t.total.toLocaleString("vi-VN")} VNĐ</div>
        <div className="mt-1 text-sm italic">(Giá trên đã bao gồm <b>{order.vatRate || 0}</b>% thuế VAT và giảm giá <b>{order.discountPct || 0}</b>% giá trị đơn hàng)</div>
      </div>
      <DebitEditor
        orderId={id}
        total={t.total}
        canWrite={canWrite}
        initial={mine.map((p) => ({ id: p.id, amount: String(p.amount), paidAt: (p.paidAt || "").slice(0, 10), note: p.note }))}
      />
    </LabPage>
  );
}
