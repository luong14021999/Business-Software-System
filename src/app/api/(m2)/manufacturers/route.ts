import { manufacturerStore, type Manufacturer } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Manufacturer>(manufacturerStore, { name: "", country: "", note: "" }, (b) => (!b.name?.trim() ? "Nhập tên nhà sản xuất" : null));
