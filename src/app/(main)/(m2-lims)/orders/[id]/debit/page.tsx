import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { orderPaymentStore, orderStore } from "@/lib/modules/m2/data/orders";
import { balance, orderTotals } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateVN } from "@/lib/platform/dates";
import { fmtVND } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "amount", label: "Số tiền (đ)", type: "number", required: true },
  { name: "paidAt", label: "Ngày thanh toán", type: "date" },
  { name: "method", label: "Hình thức", type: "select", options: ["Chuyển khoản", "Tiền mặt"] },
  { name: "note", label: "Ghi chú", placeholder: "VD: Đợt 1 – tạm ứng 50%" },
];

/** Cài đặt thanh toán: giá trị đơn hàng, các đợt thanh toán, số tiền còn lại. */
export default async function DebitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, payments, access] = await Promise.all([orderStore.list(), orderPaymentStore.list(), currentAccess()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const mine = payments.filter((p) => p.orderId === id).sort((a, b) => (a.paidAt || "").localeCompare(b.paidAt || ""));
  const t = orderTotals(order.amount, order.discountPct, order.vatRate);
  const b = balance(t.total, mine);
  const canWrite = access.can("write.reception");
  return (
    <LabPage
      title={`Cài đặt thanh toán ${order.name}`}
      subtitle={`Đơn hàng ${order.code}`}
      toolbar={
        <>
          <Link href={`/orders/${id}`} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          <Link href={`/orders/${id}/quote`} className={btn}>Báo giá</Link>
          {canWrite && (
            <EntityFormDialog
              mode="add"
              endpoint="/api/order-payments"
              title="Thêm đợt thanh toán"
              fields={[...FIELDS, { name: "orderId", label: "Đơn hàng", type: "select", options: [{ value: id, label: `${order.code} · ${order.name}` }], defaultValue: id }]}
              trigger={<button type="button" className={btn}>Thêm đợt</button>}
            />
          )}
        </>
      }
    >
      <p className="text-[15px]">
        Giá trị đơn hàng: <b>{fmtVND(t.total)}</b>
        <span className="block text-sm text-muted-foreground">(Giá trên đã gồm {order.vatRate || 0}% thuế GTGT và giảm giá {order.discountPct || 0}% giá trị đơn hàng)</span>
      </p>
      {!order.amount && <p className="mt-1 text-sm text-[#a94442]">Đơn hàng chưa có giá trị – lập ở trang <Link href={`/orders/${id}/quote`} className="underline">Báo giá</Link>.</p>}
      <div className="mt-3">
        <CatalogTable
          entity="order-payments"
          canWrite={canWrite}
          fields={FIELDS}
          emptyText="Chưa có đợt thanh toán"
          headers={["#", "Số tiền", "Ngày thanh toán", "Hình thức", "Ghi chú", "Người ghi"]}
          rows={mine.map((p, i) => ({ id: p.id, label: `đợt ${i + 1} (${fmtVND(p.amount)})`, initial: p, cells: [i + 1, fmtVND(p.amount), fmtDateVN(p.paidAt) || "—", p.method || "—", p.note, p.createdBy] }))}
        />
      </div>
      <div className="mt-3 max-w-md space-y-1 text-[15px]">
        <div className="flex justify-between"><span>Số tiền thanh toán các đợt:</span><b>{fmtVND(b.paid)}</b></div>
        <div className="flex justify-between"><span>Số tiền còn lại cần thanh toán:</span><b className={b.remaining ? "text-[#a94442]" : "text-[#3c763d]"}>{fmtVND(b.remaining)}</b></div>
      </div>
    </LabPage>
  );
}
