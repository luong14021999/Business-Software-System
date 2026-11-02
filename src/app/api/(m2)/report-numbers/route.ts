import { NextResponse } from "next/server";
import { authorize, currentAccess } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { allocateReportNo, deleteLatestReportNo } from "@/lib/modules/m2/data/report-numbers";
import { REPORT_NO_KINDS } from "@/lib/modules/m2/orders";

export const dynamic = "force-dynamic";

/** Cấp số phiếu kết quả cho đơn hàng: { orderId, kind, quantity }. */
export async function POST(req: Request) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { orderId = "", kind = "", quantity = 1 } = (await req.json()) as { orderId?: string; kind?: string; quantity?: number };
  if (!(REPORT_NO_KINDS as readonly string[]).includes(kind)) return NextResponse.json({ error: "Chọn loại số phiếu" }, { status: 400 });
  const order = (await orderStore.list()).find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  const q = Math.min(100, Math.max(1, Math.round(Number(quantity) || 1)));
  const { item, reportNo } = await allocateReportNo(order.id, kind, q, gate.actor.name);
  await logChange({ entity: "report-numbers", entityId: item.id, action: "Cấp số phiếu", label: `${order.code} · ${kind} ${reportNo}` });
  return NextResponse.json({ ok: true, item, reportNo }, { status: 201 });
}

/** "Xóa số phiếu mới nhất" của một loại số phiếu (Quản lý hoặc Quản trị). */
export async function DELETE(req: Request) {
  const access = await currentAccess();
  if (!access.actor) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  if (!access.can("results.approve") && !access.can("admin.users")) return NextResponse.json({ error: "Chỉ Quản lý hoặc Quản trị được xóa số phiếu" }, { status: 403 });
  const kind = new URL(req.url).searchParams.get("kind") ?? "";
  if (!(REPORT_NO_KINDS as readonly string[]).includes(kind)) return NextResponse.json({ error: "Chọn loại số phiếu" }, { status: 400 });
  const r = await deleteLatestReportNo(kind, access.actor.name);
  if (!r) return NextResponse.json({ error: "Chưa cấp số phiếu nào" }, { status: 404 });
  await logChange({ entity: "report-numbers", entityId: r.latest.id, action: "Xóa số phiếu", label: `${kind} ${r.no}${r.orderCode ? ` · đơn ${r.orderCode}` : ""}` });
  return NextResponse.json({ ok: true, deleted: r.no });
}
