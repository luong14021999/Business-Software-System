import { instrumentTypeStore, type InstrumentType } from "@/lib/modules/m2/data/settings";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes<InstrumentType>(instrumentTypeStore);
