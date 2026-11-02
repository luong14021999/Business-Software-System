import { notFound } from "next/navigation";
import { RequestsView } from "@/components/m2/orders/requests-view";
import { orderStore } from "@/lib/modules/m2/data/orders";

export const dynamic = "force-dynamic";

/** Yêu cầu của một đơn hàng – cùng bảng "Quản lý yêu cầu" như XaLab, chỉ lọc theo đơn. */
export default async function OrderSamplesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; stage?: string; page?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!(await orderStore.list()).some((o) => o.id === id)) notFound();
  return RequestsView({ sp, basePath: `/orders/${id}/samples`, orderId: id, backHref: "/orders" });
}
