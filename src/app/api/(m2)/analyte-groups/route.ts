import { analyteGroupStore, type AnalyteGroup } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<AnalyteGroup>(analyteGroupStore, { name: "", sort: 0, isMtld: false }, (b) => (!b.name?.trim() ? "Nhập tên nhóm" : null));
