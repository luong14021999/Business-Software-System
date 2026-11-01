import { analyteStore, type LabAnalyte } from "@/lib/modules/m2/data/orders";
import { analyteMethodStore } from "@/lib/modules/m2/data/settings";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

const routes = collectionRoutes<LabAnalyte>(
  analyteStore,
  { sampleTypeId: "", name: "", groupName: "", unit: "", method: "", loq: "", scope: "VILAS", accreditedNo: null, sort: 0, active: true, unitPrice: 0, printName: "", abbreviation: "", isField: false, note: "", formulaCode: "", industry: "", spec1Id: "", spec2Id: "", decimals: null },
  (b) => (!b.sampleTypeId ? "Chọn loại mẫu" : !b.name?.trim() ? "Nhập tên chỉ tiêu" : null),
);

export const GET = routes.GET;

/** Thêm chỉ tiêu; phương pháp chọn kèm được ghi thành phương pháp mặc định của chỉ tiêu. */
export async function POST(req: Request) {
  const res = await routes.POST(req);
  if (res.status !== 201) return res;
  const body = (await res.clone().json()) as { item: LabAnalyte };
  if (body.item.method) {
    await analyteMethodStore.create({ id: "", analyteId: body.item.id, method: body.item.method, isDefault: true, minValue: null, maxValue: null, subcontractor: "" });
  }
  return res;
}
