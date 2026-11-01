import { varietyStore, type Variety } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Variety>(
  varietyStore,
  {
    code: "",
    name: "",
    kind: "Cây trồng",
    species: "",
    origin: "",
    owner: "",
    recognitionNo: "",
    recognizedAt: "",
    traits: "",
    status: "Đang khảo nghiệm",
    scope: "Giống của Viện",
    circulationType: "Chưa lưu hành",
    circulationNo: "",
    circulationAt: "",
    regions: "",
    areaHa: 0,
    isPublic: false,
    publicSummary: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã giống" : !b.name ? "Thiếu tên giống" : null),
);
