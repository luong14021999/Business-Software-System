// Kiểm tra "người phụ trách đơn" cho NV kinh doanh / NV lấy mẫu (GĐ9).
import { NextResponse } from "next/server";
import { orderSampleStore, orderStore } from "@/lib/modules/m2/data/orders";
import { planOf } from "@/lib/modules/m2/data/order-extras";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { ownsOrder } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";

/** Các tên của người đang đăng nhập: tên tài khoản + họ tên trong hồ sơ nhân sự cùng email. */
export async function myNames(actor: { name: string; email: string } | null) {
  if (!actor) return [];
  const staff = (await staffStore.list()).filter((s) => s.email && s.email.toLowerCase() === actor.email.toLowerCase()).map((s) => s.fullName);
  return [actor.name, ...staff].filter(Boolean);
}

/** Đoàn quan trắc của đơn: người trong kế hoạch + người lấy mẫu ghi trên các mẫu. */
async function teamOf(orderId: string) {
  const [plan, samples] = await Promise.all([planOf(orderId), orderSampleStore.list()]);
  const fromPlan = plan ? [plan.leader, plan.supervisor, plan.deputy1, plan.deputy2, ...plan.groups.flat()] : [];
  const samplers = samples.filter((s) => s.orderId === orderId).flatMap((s) => (s.sampler ?? "").split(","));
  return [...fromPlan, ...samplers].map((s) => s.trim()).filter(Boolean);
}

/** Người đang đăng nhập có được sửa phần `aspect` của đơn không. */
export async function canTouchOrder(orderId: string, aspect: "sales" | "field") {
  const access = await currentAccess();
  if (!access.enabled) return true;
  const order = (await orderStore.list()).find((o) => o.id === orderId);
  if (!order) return false;
  return ownsOrder(aspect, access.roles, await myNames(access.actor), order, aspect === "field" ? await teamOf(orderId) : []);
}

/** Dùng trong API: trả 403 nếu không phải người phụ trách đơn. */
export async function orderOwnerGate(orderId: string, aspect: "sales" | "field") {
  if (await canTouchOrder(orderId, aspect)) return null;
  return NextResponse.json(
    { error: aspect === "sales" ? "Chỉ người phụ trách kinh doanh của đơn hàng (hoặc Quản lý) được sửa" : "Chỉ người được phân công quan trắc của đơn hàng (hoặc Quản lý) được sửa", code: "FORBIDDEN" },
    { status: 403 },
  );
}
