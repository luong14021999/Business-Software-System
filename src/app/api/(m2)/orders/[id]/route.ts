import { orderStore, type Order } from "@/lib/modules/m2/data/orders";
import { applyOrderDates } from "@/lib/modules/m2/data/order-extras";
import { orderOwnerGate } from "@/lib/modules/m2/data/order-access";
import { ORDER_STATUSES } from "@/lib/modules/m2/orders";
import { itemRoutes } from "@/lib/platform/api/crud";
import { vnDateOf } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const routes = itemRoutes<Order>(orderStore, {
  validate: (o) => (!o.name?.trim() ? "Nhập tên đơn hàng" : !(ORDER_STATUSES as readonly string[]).includes(o.status) ? "Trạng thái không hợp lệ" : null),
});

type ApplyAll = { fieldAt?: boolean; receivedAt?: boolean; dueAt?: boolean; disposeAt?: boolean };

/** Lưu đơn hàng (NV kinh doanh chỉ đơn mình phụ trách); `applyAll` đánh dấu mốc ngày cần áp cho tất cả yêu cầu (mẫu) của đơn. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const owner = await orderOwnerGate((await ctx.params).id, "sales");
  if (owner) return owner;
  const body = (await req.clone().json()) as Partial<Order> & { applyAll?: ApplyAll };
  const res = await routes.PATCH(req, ctx);
  const a = body.applyAll;
  if (res.ok && a && Object.values(a).some(Boolean)) {
    const { id } = await ctx.params;
    await applyOrderDates(id, {
      sampledAt: a.fieldAt ? body.fieldAt ?? "" : undefined,
      receivedAt: a.receivedAt ? vnDateOf(body.receivedAt) : undefined,
      dueAt: a.dueAt ? vnDateOf(body.dueAt) : undefined,
      disposeAt: a.disposeAt ? (body.disposeAt ?? "").slice(0, 10) : undefined,
    });
  }
  return res;
}

export const DELETE = routes.DELETE;
