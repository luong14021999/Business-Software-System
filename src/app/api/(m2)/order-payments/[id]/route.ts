import { orderPaymentStore, type OrderPayment } from "@/lib/modules/m2/data/orders";
import { orderOwnerGate } from "@/lib/modules/m2/data/order-access";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

const routes = itemRoutes<OrderPayment>(orderPaymentStore, {
  validate: (p) => (!(Number(p.amount) > 0) ? "Số tiền phải lớn hơn 0" : null),
});

type Ctx = { params: Promise<{ id: string }> };

/** Chỉ người phụ trách kinh doanh của đơn (hoặc Quản lý / NV nhận mẫu) sửa, xóa đợt thanh toán. */
async function ownerOf(ctx: Ctx) {
  const { id } = await ctx.params;
  const p = (await orderPaymentStore.list()).find((x) => x.id === id);
  return p ? orderOwnerGate(p.orderId, "sales") : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  return (await ownerOf(ctx)) ?? routes.PATCH(req, ctx);
}

export async function DELETE(req: Request, ctx: Ctx) {
  return (await ownerOf(ctx)) ?? routes.DELETE(req, ctx);
}
