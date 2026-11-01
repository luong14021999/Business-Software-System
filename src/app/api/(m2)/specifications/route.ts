import { specificationStore, type Specification } from "@/lib/modules/m2/data/orders";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Specification>(
  specificationStore,
  { name: "", columnName: "", sampleTypeId: "", note: "", active: true },
  (b) => (!b.name?.trim() ? "Nhập tên quy chuẩn" : null),
);
