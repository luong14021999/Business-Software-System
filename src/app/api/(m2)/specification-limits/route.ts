import { specLimitStore, type SpecLimit } from "@/lib/modules/m2/data/orders";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<SpecLimit>(
  specLimitStore,
  { specId: "", analyte: "", minValue: null, maxValue: null, note: "" },
  (b) =>
    !b.specId ? "Thiếu quy chuẩn" : !b.analyte?.trim() ? "Nhập tên chỉ tiêu" : b.minValue == null && b.maxValue == null ? "Nhập giới hạn tối thiểu hoặc tối đa" : null,
);
