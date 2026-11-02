import { NextResponse } from "next/server";
import { customerProfileStore } from "@/lib/modules/m2/data/customers";
import { itemRoutes } from "@/lib/platform/api/crud";
import { authorize } from "@/lib/platform/data/access";
import { dbQuery } from "@/lib/platform/db";

export const dynamic = "force-dynamic";

const routes = itemRoutes(customerProfileStore, { validate: (c) => (!String(c.name ?? "").trim() ? "Nhập tên khách hàng" : !String(c.code ?? "").trim() ? "Nhập mã khách hàng" : null) });

export const PATCH = routes.PATCH;

/** Xóa khách hàng chưa có đơn hàng / mẫu nào (đã có thì đặt trạng thái ngừng). */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const [used] = await dbQuery(
    `select (select count(*) from public.orders where customer_id = $1)::int orders, (select count(*) from public.samples where customer_id = $1)::int samples`,
    [id],
  );
  if (Number(used?.orders) || Number(used?.samples)) {
    return NextResponse.json({ error: `Khách hàng đã có ${used.orders} đơn hàng, ${used.samples} mẫu – không xóa được (sửa trạng thái thành ngừng)` }, { status: 409 });
  }
  return routes.DELETE(req, ctx);
}
