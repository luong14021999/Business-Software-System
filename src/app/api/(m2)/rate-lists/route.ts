import { rateListStore, type RateList } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<RateList>(rateListStore, { kind: "price", name: "", note: "", active: true }, (b) => (!b.name?.trim() ? "Nhập tên bảng" : b.kind !== "price" && b.kind !== "norm" ? "Loại bảng không hợp lệ" : null));
