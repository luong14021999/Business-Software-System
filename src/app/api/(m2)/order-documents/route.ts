import { orderDocumentStore, type OrderDocument } from "@/lib/modules/m2/data/order-extras";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<OrderDocument>(orderDocumentStore, { orderId: "", kind: "Khác", url: "", note: "", createdBy: "", createdAt: new Date().toISOString() }, (b) => (!b.orderId ? "Thiếu đơn hàng" : !/^https?:\/\//i.test(b.url ?? "") ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null));
