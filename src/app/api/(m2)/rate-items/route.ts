import { rateItemStore, type RateItem } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<RateItem>(rateItemStore, { listId: "", sampleTypeId: "", analyte: "", amount: 0, cost: null }, (b) => (!b.listId ? "Thiếu bảng" : !b.analyte?.trim() ? "Nhập chỉ tiêu" : null));
