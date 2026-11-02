import { NextResponse } from "next/server";
import { orderQuoteStore, type OrderQuote } from "@/lib/modules/m2/data/order-extras";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { orderOwnerGate } from "@/lib/modules/m2/data/order-access";
import { quoteItemsTotal, type QuoteItem } from "@/lib/modules/m2/orders";
import { deleteRoute } from "@/lib/platform/api/crud";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";

export const dynamic = "force-dynamic";

const remove = deleteRoute<OrderQuote>(orderQuoteStore);
type Ctx = { params: Promise<{ id: string }> };

/** Sửa báo giá (như XaLab): giảm giá, VAT, phí quản lý, ngày, ghi chú, các dòng; báo giá đã chốt thì cập nhật luôn giá trị đơn hàng. */
export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await authorize("write.sales");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const q = (await orderQuoteStore.list()).find((x) => x.id === id);
  if (!q) return NextResponse.json({ error: "Không tìm thấy báo giá" }, { status: 404 });
  const owner = await orderOwnerGate(q.orderId, "sales");
  if (owner) return owner;
  const b = (await req.json()) as Partial<OrderQuote>;
  const pct = (v: unknown, max = 100) => Math.min(max, Math.max(0, Number(v) || 0));
  const lines: QuoteItem[] = (b.lines ?? q.lines)
    .map((l) => ({ label: String(l.label ?? "").trim(), unit: String(l.unit ?? ""), quantity: Number(l.quantity) || 0, unitPrice: Math.round(Number(l.unitPrice) || 0), group: l.group ? String(l.group) : undefined }))
    .filter((l) => l.label && l.quantity > 0);
  const discountPct = pct(b.discountPct ?? q.discountPct);
  const vatRate = pct(b.vatRate ?? q.vatRate);
  const managementFeePct = pct(b.managementFeePct ?? q.managementFeePct, 1000);
  const t = quoteItemsTotal(lines, discountPct, vatRate, managementFeePct);
  const item = await orderQuoteStore.update(id, { discountPct, vatRate, managementFeePct, quotedAt: b.quotedAt ?? q.quotedAt, note: b.note ?? q.note, lines, total: t.total });
  const order = (await orderStore.list()).find((o) => o.id === q.orderId);
  if (order && order.quoteNo === q.code) await orderStore.update(order.id, { amount: t.sub, discountPct, vatRate, quotedAt: b.quotedAt ?? q.quotedAt });
  await logChange({ entity: "orders", entityId: q.orderId, action: "Sửa báo giá", label: q.code, changes: [{ field: "tổng cộng", old: String(q.total), new: String(t.total) }] });
  return NextResponse.json({ ok: true, item, total: t.total });
}

/** Xóa báo giá lập nhầm – người phụ trách kinh doanh của đơn hoặc Quản lý. */
export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const q = (await orderQuoteStore.list()).find((x) => x.id === id);
  const owner = q ? await orderOwnerGate(q.orderId, "sales") : null;
  return owner ?? remove(req, ctx);
}
