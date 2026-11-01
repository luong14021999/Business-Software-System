import { instrumentTypeStore, type NamedItem } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<NamedItem>(instrumentTypeStore, { name: "", note: "" }, (b) => (!b.name?.trim() ? "Nhập tên loại thiết bị" : null));
