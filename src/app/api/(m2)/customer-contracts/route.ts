import { contractStore, type CustomerContract } from "@/lib/modules/m2/data/catalogs";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<CustomerContract>(
  contractStore,
  { customerId: "", contractNo: "", value: 0, signedAt: "", liquidatedAt: "", signerA: "", signerB: "", contractUrl: "", liquidationUrl: "", invoiceUrl: "", createdAt: "" },
  (b) => (!b.customerId ? "Chọn khách hàng" : !String(b.contractNo ?? "").trim() ? "Nhập số hợp đồng" : Number(b.value) < 0 ? "Giá trị hợp đồng không được âm" : null),
);
