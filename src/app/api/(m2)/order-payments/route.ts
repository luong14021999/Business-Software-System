import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { labelOf, logChange } from "@/lib/platform/data/change-log";
import { orderPaymentStore, orderStore, type OrderPayment } from "@/lib/modules/m2/data/orders";
import { orderOwnerGate } from "@/lib/modules/m2/data/order-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await orderPaymentStore.list();
  return NextResponse.json({ count: items.length, items });
}

/** Ghi một đợt thanh toán của đơn hàng. */
export async function POST(req: Request) {
  const gate = await authorize("write.sales");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Partial<OrderPayment>;
  if (!(await orderStore.list()).some((o) => o.id === b.orderId)) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 400 });
  const owner = await orderOwnerGate(b.orderId!, "sales");
  if (owner) return owner;
  if (!(Number(b.amount) > 0)) return NextResponse.json({ error: "Số tiền phải lớn hơn 0" }, { status: 400 });
  const item = await orderPaymentStore.create({
    id: "",
    orderId: b.orderId!,
    amount: Math.round(Number(b.amount)),
    paidAt: b.paidAt ?? "",
    method: b.method ?? "",
    note: b.note ?? "",
    createdBy: gate.actor.name,
  });
  await logChange({ entity: "order-payments", entityId: item.id, action: "Thêm", label: labelOf(item as unknown as Record<string, unknown>) });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
