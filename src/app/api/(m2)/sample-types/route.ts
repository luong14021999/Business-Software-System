import { sampleTypeStore, type SampleType } from "@/lib/modules/m2/data/orders";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<SampleType>(
  sampleTypeStore,
  { name: "", prefix: "", sort: 0, defaultContainer: "", description: "", active: true },
  (b) => (!b.name?.trim() ? "Nhập tên loại mẫu" : !b.prefix?.trim() ? "Nhập tiền tố mã mẫu" : null),
);
