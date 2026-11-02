import { orderQuoteStore, type OrderQuote } from "@/lib/modules/m2/data/order-extras";
import { orderOwnerGate } from "@/lib/modules/m2/data/order-access";
import { deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

const remove = deleteRoute<OrderQuote>(orderQuoteStore);

/** Phiên bản báo giá không sửa (lưu vết); chỉ xóa phiên bản lập nhầm – người phụ trách kinh doanh của đơn hoặc Quản lý. */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const q = (await orderQuoteStore.list()).find((x) => x.id === id);
  const owner = q ? await orderOwnerGate(q.orderId, "sales") : null;
  return owner ?? remove(req, ctx);
}
