import { staffStore } from "@/lib/modules/m2/data/staff";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";
import type { Staff } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const patch = patchRoute(staffStore);

/** Sửa nhân viên; quyền bị chặn riêng chỉ đổi qua /api/lab-staff/[id]/access (Quản trị) nên bỏ khỏi body. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { denied: _ignored, ...body } = (await req.json()) as Partial<Staff>;
  void _ignored;
  return patch(new Request(req.url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), ctx);
}

export const DELETE = deleteRoute(staffStore);
