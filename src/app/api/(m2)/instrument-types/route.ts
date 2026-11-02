import { instrumentTypeStore, type InstrumentType } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<InstrumentType>(instrumentTypeStore, { name: "", note: "", description: "", unit: "", depreciationYears: "", shiftsPerYear: null, manualUrl: "", isField: false, departmentId: "" }, (b) => (!b.name?.trim() ? "Nhập tên loại thiết bị" : null));
