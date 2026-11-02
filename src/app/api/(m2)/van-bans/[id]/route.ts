import { itemRoutes } from "@/lib/platform/api/crud";
import { vanBanStore } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

const routes = itemRoutes(vanBanStore, { validate: (b) => ("number" in b && !String(b.number ?? "").trim() ? "Nhập số văn bản" : null) });

/** Sửa / xóa hồ sơ (văn bản). */
export const PATCH = routes.PATCH;
export const DELETE = routes.DELETE;
