import { contactStore, type CustomerContact } from "@/lib/modules/m2/data/order-extras";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<CustomerContact>(contactStore, { customerId: "", name: "", title: "", phone: "", email: "", note: "" }, (b) => (!b.customerId ? "Thiếu khách hàng" : !b.name?.trim() ? "Nhập tên người liên hệ" : null));
