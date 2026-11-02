import { analyteMappingStore, checkMapping, type AnalyteMapping } from "@/lib/modules/m2/data/settings";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

/** Sửa / xóa khai báo chỉ tiêu phụ. */
export const { PATCH, DELETE } = itemRoutes<AnalyteMapping>(analyteMappingStore, { validate: checkMapping });
