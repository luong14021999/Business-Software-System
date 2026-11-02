import { preservationStore, type Preservation } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Preservation>(preservationStore, { name: "", description: "", sampleTypeId: "", isField: false }, (b) => (!b.name?.trim() ? "Nhập cách bảo quản" : null));
