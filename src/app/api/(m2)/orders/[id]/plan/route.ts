import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { savePlan, suggestPlanItems, type OrderPlan, type PlanItem } from "@/lib/modules/m2/data/order-extras";
import { PLAN_ITEM_KINDS } from "@/lib/modules/m2/orders";

export const dynamic = "force-dynamic";

type Body = { plan?: Partial<OrderPlan>; items?: Partial<PlanItem>[] };

/** Gợi ý thiết bị / dụng cụ / bảo quản từ các chỉ tiêu đã bóc tách của đơn. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("work.assign");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  return NextResponse.json({ items: await suggestPlanItems(id) });
}

/** Lưu kế hoạch quan trắc: nhân sự đoàn, thời gian, phương tiện và danh sách thiết bị / vật tư – hóa chất / bảo quản. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("work.assign");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const order = (await orderStore.list()).find((o) => o.id === id);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  const { plan = {}, items = [] } = (await req.json()) as Body;
  const t = (v: unknown) => String(v ?? "").trim();
  const startAt = t(plan.startAt).slice(0, 10);
  const endAt = t(plan.endAt).slice(0, 10);
  if (startAt && endAt && endAt < startAt) return NextResponse.json({ error: "Ngày kết thúc trước ngày bắt đầu" }, { status: 400 });
  const groups = (Array.isArray(plan.groups) ? plan.groups : [])
    .map((g) => (Array.isArray(g) ? g.map(t).filter(Boolean) : []))
    .filter((g) => g.length);
  const clean = items
    .map((i) => ({ kind: t(i.kind), name: t(i.name), quantity: t(i.quantity), note: t(i.note), sort: 0 }))
    .filter((i) => i.name);
  const bad = clean.find((i) => !(PLAN_ITEM_KINDS as readonly string[]).includes(i.kind));
  if (bad) return NextResponse.json({ error: `Loại "${bad.kind}" không hợp lệ` }, { status: 400 });
  await savePlan(
    id,
    { leader: t(plan.leader), supervisor: t(plan.supervisor), deputy1: t(plan.deputy1), deputy2: t(plan.deputy2), groups, startAt, endAt, vehicle: t(plan.vehicle), note: t(plan.note), updatedBy: gate.actor.name },
    clean,
  );
  await logChange({
    entity: "order-plans",
    entityId: id,
    action: "Sửa",
    label: `${order.code} · ${order.name}`,
    changes: [{ field: "kế hoạch quan trắc", old: "", new: `trưởng đoàn ${t(plan.leader) || "—"}, ${groups.length} nhóm, ${clean.length} thiết bị/vật tư` }],
  });
  return NextResponse.json({ ok: true });
}
