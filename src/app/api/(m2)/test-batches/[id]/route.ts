import { testBatchStore, type TestBatch } from "@/lib/modules/m2/data/orders";
import { BATCH_STATUSES } from "@/lib/modules/m2/orders";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

/** Xóa mẻ: các dòng kết quả được gỡ khỏi mẻ (khóa ngoại "set null"), không mất kết quả. */
export const { PATCH, DELETE } = itemRoutes<TestBatch>(testBatchStore, {
  validate: (b) => (!(BATCH_STATUSES as readonly string[]).includes(b.status) ? "Trạng thái không hợp lệ" : null),
});
