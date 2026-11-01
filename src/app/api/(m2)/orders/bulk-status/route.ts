import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { ORDER_STATUSES } from "@/lib/modules/m2/orders";

export const dynamic = "force-dynamic";

/** Chuyển trạng thái nhiều đơn hàng cùng lúc (nút Quan trắc / Phân tích / Trả kết quả / Thanh lý / Hủy). */
export async function POST(req: Request) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { ids = [], status } = (await req.json()) as { ids?: string[]; status?: string };
  if (!status || !(ORDER_STATUSES as readonly string[]).includes(status)) return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  if (!ids.length) return NextResponse.json({ error: "Chọn ít nhất một đơn hàng" }, { status: 400 });
  const all = new Map((await orderStore.list()).map((o) => [o.id, o]));
  let n = 0;
  for (const id of ids) {
    const before = all.get(id);
    if (!before || before.status === status) continue;
    const patch: Record<string, string> = { status };
    if (status === "Trả kết quả" && !before.deliveredAt) patch.deliveredAt = new Date().toISOString();
    await orderStore.update(id, patch);
    await logChange({ entity: "orders", entityId: id, action: "Sửa", label: `${before.code} · ${before.name}`, changes: [{ field: "status", old: before.status, new: status }] });
    n++;
  }
  return NextResponse.json({ ok: true, updated: n });
}
