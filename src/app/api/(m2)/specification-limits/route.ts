import { specLimitStore, type SpecLimit } from "@/lib/modules/m2/data/orders";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<SpecLimit>(
  specLimitStore,
  { specId: "", analyte: "", minValue: null, maxValue: null, note: "", notDetected: false, ndText: "", printNote: "", printText: "" },
  (b) =>
    !b.specId ? "Thiếu quy chuẩn" : !b.analyte?.trim() ? "Nhập tên chỉ tiêu" : b.minValue == null && b.maxValue == null && !b.notDetected ? "Nhập giới hạn tối thiểu hoặc tối đa (hoặc đánh dấu quy chuẩn dạng chữ)" : null,
);
