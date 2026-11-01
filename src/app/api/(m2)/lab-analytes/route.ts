import { analyteStore, type LabAnalyte } from "@/lib/modules/m2/data/orders";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<LabAnalyte>(
  analyteStore,
  { sampleTypeId: "", name: "", groupName: "", unit: "", method: "", loq: "", scope: "VILAS", accreditedNo: null, sort: 0, active: true, unitPrice: 0 },
  (b) => (!b.sampleTypeId ? "Chọn loại mẫu" : !b.name?.trim() ? "Nhập tên chỉ tiêu" : null),
);
