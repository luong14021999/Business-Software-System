import { specificationStore, type Specification } from "@/lib/modules/m2/data/orders";
import { withStandard } from "@/lib/modules/m2/data/specs";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Sửa cột quy chuẩn; đổi Quy chuẩn thì cập nhật tên quy chuẩn và loại mẫu theo. */
export async function PATCH(req: Request, ctx: Ctx) {
  const body = await withStandard((await req.json()) as Partial<Specification>);
  return patchRoute(specificationStore)(new Request(req.url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), ctx);
}

export const DELETE = deleteRoute(specificationStore);
