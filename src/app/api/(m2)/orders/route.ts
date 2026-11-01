import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { labelOf, logChange } from "@/lib/platform/data/change-log";
import { orderStore, type Order } from "@/lib/modules/m2/data/orders";
import { ORDER_KINDS, ORDER_STATUSES, nextOrderCode } from "@/lib/modules/m2/orders";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await orderStore.list();
  return NextResponse.json({ count: items.length, items });
}

/** Thêm đơn hàng: mã tự sinh theo năm (26.7…), trạng thái đầu "Báo giá". */
export async function POST(req: Request) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const body = (await req.json()) as Partial<Order>;
  if (!body.name?.trim()) return NextResponse.json({ error: "Nhập tên đơn hàng" }, { status: 400 });
  if (body.kind && !(ORDER_KINDS as readonly string[]).includes(body.kind)) return NextResponse.json({ error: "Loại đơn hàng không hợp lệ" }, { status: 400 });
  if (body.status && !(ORDER_STATUSES as readonly string[]).includes(body.status)) return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  const existing = (await orderStore.list()).map((o) => o.code);
  const item = await orderStore.create({
    ...body,
    id: "",
    code: nextOrderCode(Number(todayISO().slice(0, 4)), existing),
    name: body.name.trim(),
    kind: body.kind || "Mẫu gửi",
    status: body.status || "Báo giá",
    createdBy: gate.actor.name,
    createdAt: new Date().toISOString(),
  } as Order);
  await logChange({ entity: "orders", entityId: item.id, action: "Thêm", label: labelOf(item as unknown as Record<string, unknown>) });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
