import { seedlingOrderStore, type SeedlingOrder } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<SeedlingOrder>(
  seedlingOrderStore,
  {
    code: "",
    customerId: "",
    profileId: "",
    species: "",
    variety: "",
    quantity: 0,
    gradeRequired: "Loại 1",
    dueAt: "",
    season: "",
    unitPrice: 0,
    status: "Mới",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã đơn hàng" : !b.species ? "Thiếu loài" : !(Number(b.quantity) > 0) ? "Số lượng phải lớn hơn 0" : null),
);
