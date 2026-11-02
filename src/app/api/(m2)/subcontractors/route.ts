import { subcontractorStore, type Subcontractor } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Subcontractor>(subcontractorStore, { name: "", code: "", phone: "", note: "", active: true, taxCode: "", fax: "", email: "", address: "", invoiceAddress: "", contact: "", asInternal: false }, (b) => (!b.name?.trim() ? "Nhập tên đơn vị" : ["VILAS", "Nội bộ"].includes(b.name.trim()) ? "Tên này đã dành cho phạm vi VILAS / Nội bộ" : null));
