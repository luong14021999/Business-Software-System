import { labMethodStore, type LabMethod } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<LabMethod>(labMethodStore, { name: "", description: "", active: true }, (b) => (!b.name?.trim() ? "Nhập tên phương pháp" : null));
