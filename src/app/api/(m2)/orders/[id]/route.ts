import { orderStore, type Order } from "@/lib/modules/m2/data/orders";
import { ORDER_STATUSES } from "@/lib/modules/m2/orders";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes<Order>(orderStore, {
  validate: (o) => (!o.name?.trim() ? "Nhập tên đơn hàng" : !(ORDER_STATUSES as readonly string[]).includes(o.status) ? "Trạng thái không hợp lệ" : null),
});
