import { specificationStore, type Specification } from "@/lib/modules/m2/data/orders";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes<Specification>(specificationStore);
