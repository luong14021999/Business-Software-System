import { NextResponse } from "next/server";
import { catalogOf } from "@/lib/modules/m2/catalog-registry";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string; id: string }> };

const routesOf = async (ctx: Ctx) => {
  const def = catalogOf((await ctx.params).slug);
  return def ? itemRoutes(def.store, { validate: def.validate }) : null;
};
const missing = () => NextResponse.json({ error: "Không có danh mục này" }, { status: 404 });

/** Sửa / xóa bản ghi của một danh mục Cài đặt. */
export async function PATCH(req: Request, ctx: Ctx) {
  const r = await routesOf(ctx);
  return r ? r.PATCH(req, { params: ctx.params.then((p) => ({ id: p.id })) }) : missing();
}

export async function DELETE(req: Request, ctx: Ctx) {
  const r = await routesOf(ctx);
  return r ? r.DELETE(req, { params: ctx.params.then((p) => ({ id: p.id })) }) : missing();
}
