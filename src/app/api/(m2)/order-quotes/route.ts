import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderQuoteStore, type OrderQuote } from "@/lib/modules/m2/data/order-extras";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { orderOwnerGate } from "@/lib/modules/m2/data/order-access";
import { nextQuoteCode, quoteItemsTotal, type QuoteItem } from "@/lib/modules/m2/orders";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await orderQuoteStore.list();
  return NextResponse.json({ count: items.length, items });
}

/** Lưu một phiên bản báo giá: số báo giá tự tăng theo đơn, tổng tiền tính lại ở máy chủ. */
export async function POST(req: Request) {
  const gate = await authorize("write.sales");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Partial<OrderQuote>;
  const order = (await orderStore.list()).find((o) => o.id === b.orderId);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 400 });
  const owner = await orderOwnerGate(order.id, "sales");
  if (owner) return owner;
  const lines: QuoteItem[] = (b.lines ?? [])
    .map((l) => ({ label: String(l.label ?? "").trim(), unit: String(l.unit ?? ""), quantity: Number(l.quantity) || 0, unitPrice: Math.round(Number(l.unitPrice) || 0), group: l.group ? String(l.group) : undefined }))
    .filter((l) => l.label && l.quantity > 0);
  if (!lines.length) return NextResponse.json({ error: "Báo giá chưa có dòng nào (số lượng > 0)" }, { status: 400 });
  const discountPct = Number(b.discountPct) || 0;
  const vatRate = Number(b.vatRate) || 0;
  const existing = (await orderQuoteStore.list()).filter((q) => q.orderId === order.id).map((q) => q.code);
  const item = await orderQuoteStore.create({
    id: "",
    orderId: order.id,
    kind: b.kind === "before" ? "before" : "after",
    code: nextQuoteCode(order.code, existing),
    quotedAt: b.quotedAt || todayISO(),
    discountPct,
    vatRate,
    note: b.note ?? "",
    lines,
    total: quoteItemsTotal(lines, discountPct, vatRate).total,
    createdBy: gate.actor.name,
    createdAt: new Date().toISOString(),
  });
  await logChange({ entity: "order-quotes", entityId: item.id, action: "Thêm", label: `${item.code} · ${order.name}` });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
