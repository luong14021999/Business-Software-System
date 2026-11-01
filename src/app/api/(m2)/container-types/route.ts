import { containerTypeStore, type ContainerType } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<ContainerType>(containerTypeStore, { name: "", symbol: "", volume: "", note: "" }, (b) => (!b.name?.trim() ? "Nhập tên dụng cụ" : null));
