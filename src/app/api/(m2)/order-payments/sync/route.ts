import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderPaymentStore, orderStore } from "@/lib/modules/m2/data/orders";
import { orderOwnerGate } from "@/lib/modules/m2/data/order-access";

export const dynamic = "force-dynamic";

type Row = { id?: string; amount?: number | string; paidAt?: string; note?: string };

/** Lưu toàn bộ các đợt thanh toán của đơn như form XaLab: thêm dòng mới, sửa dòng cũ, xóa dòng bị bỏ. */
export async function PUT(req: Request) {
  const gate = await authorize("write.sales");
  if (!gate.ok) return gate.response;
  const { orderId, rows = [] } = (await req.json()) as { orderId?: string; rows?: Row[] };
  const order = (await orderStore.list()).find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  const owner = await orderOwnerGate(order.id, "sales");
  if (owner) return owner;
  const clean = rows.map((r) => ({ id: r.id ?? "", amount: Math.round(Number(String(r.amount ?? "").replace(/[.\s]/g, "").replace(",", "."))), paidAt: String(r.paidAt ?? "").slice(0, 10), note: String(r.note ?? "").trim() }));
  const bad = clean.findIndex((r) => !(r.amount > 0));
  if (bad >= 0) return NextResponse.json({ error: `Đợt ${bad + 1}: số tiền phải lớn hơn 0` }, { status: 400 });
  const before = (await orderPaymentStore.list()).filter((p) => p.orderId === order.id);
  for (const p of before) if (!clean.some((r) => r.id === p.id)) await orderPaymentStore.remove(p.id);
  for (const r of clean) {
    const old = before.find((p) => p.id === r.id);
    if (!old) await orderPaymentStore.create({ id: "", orderId: order.id, amount: r.amount, paidAt: r.paidAt, method: "", note: r.note, createdBy: gate.actor.name });
    else if (old.amount !== r.amount || (old.paidAt || "").slice(0, 10) !== r.paidAt || old.note !== r.note) await orderPaymentStore.update(old.id, { amount: r.amount, paidAt: r.paidAt, note: r.note });
  }
  const total = clean.reduce((s, r) => s + r.amount, 0);
  await logChange({ entity: "orders", entityId: order.id, action: "Công nợ", label: `${order.code} · ${order.name}`, changes: [{ field: "thanh toán", old: String(before.reduce((s, p) => s + p.amount, 0)), new: `${clean.length} đợt – ${total.toLocaleString("vi-VN")} đ` }] });
  return NextResponse.json({ ok: true, rows: clean.length, total });
}
