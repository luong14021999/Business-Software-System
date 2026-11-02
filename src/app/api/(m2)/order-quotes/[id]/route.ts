import { orderQuoteStore, type OrderQuote } from "@/lib/modules/m2/data/order-extras";
import { deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

/** Phiên bản báo giá không sửa (lưu vết); chỉ xóa phiên bản lập nhầm. */
export const DELETE = deleteRoute<OrderQuote>(orderQuoteStore);
