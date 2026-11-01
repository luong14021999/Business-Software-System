import { bulkTemplateStore, type BulkTemplate } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<BulkTemplate>(bulkTemplateStore, { name: "", sampleTypeId: "", description: "", lines: [], createdBy: "" }, (b) => (!b.name?.trim() ? "Nhập tên mẫu bóc tách" : !b.sampleTypeId ? "Chọn loại mẫu" : null));
