import { varietyDocumentStore } from "@/lib/modules/m3/data/breeding";
import { itemRoutes } from "@/lib/platform/api/crud";
import { safeUrl } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(varietyDocumentStore, { validate: (m) => (m.url && !safeUrl(m.url) ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null) });
