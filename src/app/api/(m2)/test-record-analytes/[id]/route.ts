import { testRecordAnalyteStore } from "@/lib/modules/m2/data/catalogs";
import { deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const DELETE = deleteRoute(testRecordAnalyteStore);
