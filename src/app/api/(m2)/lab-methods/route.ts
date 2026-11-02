import { labMethodStore, type LabMethod } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<LabMethod>(labMethodStore, { name: "", description: "", active: true, analyst: "", attachmentUrl: "", recordTemplate1: "", recordTemplate2: "", isokinetic: false, quickMeasure: false, subcontractorMethod: false }, (b) => (!b.name?.trim() ? "Nhập tên phương pháp" : null));
