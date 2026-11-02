import { specificationStore, type Specification } from "@/lib/modules/m2/data/orders";
import { withStandard } from "@/lib/modules/m2/data/specs";
import { createRoute, listRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

const DEFAULTS: Omit<Specification, "id"> = { name: "", columnName: "", sampleTypeId: "", note: "", active: true, printName: "", printNote: "", standardId: "", englishName: "" };
const check = (b: Partial<Specification>) => (!String(b.columnName ?? "").trim() && !String(b.name ?? "").trim() ? "Nhập tên cột quy chuẩn" : !String(b.name ?? "").trim() ? "Chọn quy chuẩn" : null);

export const GET = listRoute(specificationStore);

/** Thêm cột quy chuẩn; tên quy chuẩn và loại mẫu lấy theo Quy chuẩn đã chọn. */
export async function POST(req: Request) {
  const body = await withStandard((await req.json()) as Partial<Specification>);
  const forward = new Request(req.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return createRoute<Specification>(specificationStore, (b) => ({ ...DEFAULTS, ...b, id: "" }) as Specification, check)(forward);
}
