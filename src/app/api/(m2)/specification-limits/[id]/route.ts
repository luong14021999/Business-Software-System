import { specLimitStore, type SpecLimit } from "@/lib/modules/m2/data/orders";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes<SpecLimit>(specLimitStore);
