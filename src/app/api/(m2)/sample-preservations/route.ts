import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderSampleStore, orderStore } from "@/lib/modules/m2/data/orders";
import { samplePreservationStore } from "@/lib/modules/m2/data/order-extras";
import { dbQuery } from "@/lib/platform/db";

export const dynamic = "force-dynamic";

/** Ghi đè bảo quản của các yêu cầu (mẫu) thuộc một loại mẫu trong đơn hàng. */
export async function PUT(req: Request) {
  const gate = await authorize("work.assign");
  if (!gate.ok) return gate.response;
  const { orderId, sampleTypeId, cells = [] } = (await req.json()) as { orderId?: string; sampleTypeId?: string; cells?: { sampleId: string; preservationId: string }[] };
  const order = (await orderStore.list()).find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  const samples = (await orderSampleStore.list()).filter((s) => s.orderId === order.id && s.sampleTypeId === sampleTypeId).map((s) => s.id);
  if (!samples.length) return NextResponse.json({ error: "Đơn hàng không có mẫu thuộc loại này" }, { status: 400 });
  const keep = cells.filter((c) => samples.includes(c.sampleId) && c.preservationId);
  await dbQuery(`delete from public.sample_preservations where sample_id = any($1::uuid[])`, [samples]);
  for (const c of keep) await samplePreservationStore.create({ id: "", sampleId: c.sampleId, preservationId: c.preservationId });
  await logChange({ entity: "orders", entityId: order.id, action: "Bảo quản", label: `${order.code} · ${order.name}`, changes: [{ field: "bảo quản", old: "", new: `${keep.length} ô (mẫu × cách bảo quản)` }] });
  return NextResponse.json({ ok: true, saved: keep.length });
}
