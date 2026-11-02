import { analyteResourceStore, type AnalyteResource } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<AnalyteResource>(analyteResourceStore, { analyteId: "", kind: "instrument", name: "", isDefault: false }, (b) => (!b.analyteId ? "Thiếu chỉ tiêu" : !b.name?.trim() ? "Chọn hoặc nhập tên" : !["instrument", "instrument_lab", "container", "preservation", "analyst", "chemical"].includes(b.kind ?? "") ? "Loại không hợp lệ" : null));
