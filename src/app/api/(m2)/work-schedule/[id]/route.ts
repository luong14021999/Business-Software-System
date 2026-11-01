import { workScheduleStore, type WorkItem } from "@/lib/modules/m2/data/orders";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes<WorkItem>(workScheduleStore, {
  validate: (w) => (!w.staffName?.trim() ? "Chọn nhân viên" : !w.title?.trim() ? "Nhập nội dung công việc" : null),
});
