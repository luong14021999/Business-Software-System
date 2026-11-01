import { batchTemplateStore, type BatchTemplate } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<BatchTemplate>(batchTemplateStore, { name: "", method: "", analyst: "", instrumentCode: "", chemicals: "", note: "" }, (b) => (!b.name?.trim() ? "Nhập tên mẫu mẻ" : null));
