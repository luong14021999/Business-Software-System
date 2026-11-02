import { contractStore } from "@/lib/modules/m2/data/catalogs";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(contractStore, {
  validate: (b) => (!String(b.contractNo ?? "").trim() ? "Nhập số hợp đồng" : Number(b.value) < 0 ? "Giá trị hợp đồng không được âm" : null),
});
