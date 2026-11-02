import { customerProfileStore, type CustomerProfile } from "@/lib/modules/m2/data/customers";
import { nextCustomerCode } from "@/lib/modules/m2/customer-forms";
import { createRoute } from "@/lib/platform/api/crud";
import { authorize } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const DEFAULTS: Omit<CustomerProfile, "id"> = {
  code: "", name: "", kind: "Doanh nghiệp", contact: "", phone: "", address: "", printName: "", englishName: "", taxCode: "", bankAccount: "", fax: "", email: "",
  province: "", addressOld: "", invoiceAddress: "", representative: "", representativeTitle: "", departmentId: "", isRequestingUnit: false, isInspection: false,
  active: true, createdBy: "", createdAt: "",
};

/** Thêm khách hàng theo form XaLab: mã để trống thì tự sinh KH-năm-số; người tạo là người đăng nhập. */
export async function POST(req: Request) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const body = (await req.json()) as Partial<CustomerProfile>;
  let code = String(body.code ?? "").trim();
  if (!code) code = nextCustomerCode(new Date().getFullYear(), (await customerProfileStore.list()).map((c) => c.code));
  const create = createRoute<CustomerProfile>(
    customerProfileStore,
    (b) => ({ ...DEFAULTS, ...b, code, createdBy: gate.actor.name, createdAt: new Date().toISOString(), id: "" }),
    (b) => (!String(b.name ?? "").trim() ? "Nhập tên khách hàng" : null),
  );
  return create(new Request(req.url, { method: "POST", headers: req.headers, body: JSON.stringify(body) }));
}
