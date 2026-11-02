import { analyteMappingStore, checkMapping, type AnalyteMapping } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

const routes = collectionRoutes<AnalyteMapping>(analyteMappingStore, { sampleTypeId: "", mainAnalyteId: "", method: "", accessoryIds: [], hideAccessory: false }, (b) => (!b.mainAnalyteId ? "Chọn chỉ tiêu chính" : checkMapping(b) ?? (!b.accessoryIds?.length ? "Chọn ít nhất một chỉ tiêu phụ" : null)));

/** Thêm khai báo chỉ tiêu phụ. */
export const GET = routes.GET;
export const POST = routes.POST;
