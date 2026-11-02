import { locationStore, type CustomerLocation } from "@/lib/modules/m2/data/order-extras";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<CustomerLocation>(locationStore, { customerId: "", name: "", oldName: "", description: "", englishName: "" }, (b) => (!b.customerId ? "Thiếu khách hàng" : !b.name?.trim() ? "Nhập địa điểm" : null));
