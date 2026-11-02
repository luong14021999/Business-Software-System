import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderQuoteStore } from "@/lib/modules/m2/data/order-extras";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { quoteItemsTotal } from "@/lib/modules/m2/orders";

export const dynamic = "force-dynamic";

/** Chốt phiên bản báo giá làm giá trị đơn hàng (dùng cho công nợ). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const q = (await orderQuoteStore.list()).find((x) => x.id === id);
  if (!q) return NextResponse.json({ error: "Không tìm thấy báo giá" }, { status: 404 });
  const t = quoteItemsTotal(q.lines, q.discountPct, q.vatRate);
  await orderStore.update(q.orderId, { amount: t.sub, discountPct: q.discountPct, vatRate: q.vatRate, quoteNo: q.code, quotedAt: q.quotedAt });
  await logChange({ entity: "orders", entityId: q.orderId, action: "Sửa", label: q.code, changes: [{ field: "báo giá chốt", old: "", new: `${q.code} – ${t.total.toLocaleString("vi-VN")} đ` }] });
  return NextResponse.json({ ok: true, total: t.total });
}
