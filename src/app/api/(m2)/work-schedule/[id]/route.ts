import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { workScheduleStore, type WorkItem } from "@/lib/modules/m2/data/orders";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

const routes = itemRoutes<WorkItem>(workScheduleStore, {
  validate: (w) => (!w.staffName?.trim() ? "Chọn nhân viên" : !w.title?.trim() ? "Nhập nội dung công việc" : null),
});

type Ctx = { params: Promise<{ id: string }> };

/** Nhân viên chỉ sửa / xóa kế hoạch của chính mình; Quản lý / Quản trị sửa được của mọi người. */
async function ownerGate(req: Request, ctx: Ctx, withBody: boolean) {
  const gate = await authorize("write.any");
  if (!gate.ok) return gate.response;
  const manager = !gate.roles.length || gate.roles.some((r) => r === "Quản lý" || r === "Quản trị");
  if (manager) return null;
  const { id } = await ctx.params;
  const item = (await workScheduleStore.list()).find((w) => w.id === id);
  const target = withBody ? ((await req.clone().json().catch(() => ({}))) as Partial<WorkItem>).staffName : undefined;
  if ((item && item.staffName !== gate.actor.name) || (target !== undefined && target !== gate.actor.name)) {
    return NextResponse.json({ error: "Chỉ sửa được kế hoạch của chính mình" }, { status: 403 });
  }
  return null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  return (await ownerGate(req, ctx, true)) ?? routes.PATCH(req, ctx);
}

export async function DELETE(req: Request, ctx: Ctx) {
  return (await ownerGate(req, ctx, false)) ?? routes.DELETE(req, ctx);
}
