import { pointStore, type MonitoringPoint } from "@/lib/modules/m2/data/order-extras";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<MonitoringPoint>(pointStore, { locationId: "", name: "", description: "", lat: null, lng: null }, (b) => (!b.locationId ? "Thiếu địa điểm" : !b.name?.trim() ? "Nhập tên vị trí" : b.lat != null && (b.lat < -90 || b.lat > 90) ? "Vĩ độ phải trong khoảng -90 đến 90" : b.lng != null && (b.lng < -180 || b.lng > 180) ? "Kinh độ phải trong khoảng -180 đến 180" : null));
