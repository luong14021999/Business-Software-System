import { orderPaymentStore, type OrderPayment } from "@/lib/modules/m2/data/orders";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes<OrderPayment>(orderPaymentStore, {
  validate: (p) => (!(Number(p.amount) > 0) ? "Số tiền phải lớn hơn 0" : null),
});
