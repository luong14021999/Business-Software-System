import { RequestsView, type RequestsSP } from "@/components/m2/orders/requests-view";

export const dynamic = "force-dynamic";

/** Quản lý yêu cầu: mọi yêu cầu (mẫu) thuộc đơn hàng, mới nhất trước. */
export default async function RequestsPage({ searchParams }: { searchParams: Promise<RequestsSP> }) {
  return RequestsView({ sp: await searchParams, basePath: "/requests" });
}
