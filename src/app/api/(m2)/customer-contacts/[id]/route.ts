import { contactStore, type CustomerContact } from "@/lib/modules/m2/data/order-extras";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes<CustomerContact>(contactStore);
