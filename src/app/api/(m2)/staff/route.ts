import { staffStore } from "@/lib/modules/m2/data/staff";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { Staff } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(staffStore);

/** Mã nhân viên kế tiếp NV-001… khi thêm từ trang Nhân viên (form XaLab không có ô mã). */
async function nextCode() {
  const max = (await staffStore.list()).reduce((m, s) => Math.max(m, /^NV-\d+$/.test(s.code) ? Number(s.code.slice(3)) : 0), 0);
  return `NV-${String(max + 1).padStart(3, "0")}`;
}

/** Thêm nhân viên (trang Nhân sự ISO hoặc trang Nhân viên kiểu XaLab). */
export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Staff>;
  const code = body.code?.trim() || (await nextCode());
  return create(new Request(req.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, code }) }));
}

const create = createRoute<Staff>(
  staffStore,
  (body) => ({
    id: "",
    code: body.code ?? "",
    fullName: body.fullName ?? "",
    position: body.position ?? "",
    department: body.department ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    joinedAt: body.joinedAt ?? new Date().toISOString().slice(0, 10),
    competencies: body.competencies ?? [],
    trainings: body.trainings ?? [],
    status: body.status ?? "Đang làm việc",
    salutation: body.salutation ?? "",
    phone2: body.phone2 ?? "",
    signFor: body.signFor ?? "",
    collaborator: Boolean(body.collaborator),
    departmentId: body.departmentId ?? "",
  }),
  (body) => {
    if (!body.code) return "Thiếu mã NV";
    if (!body.fullName) return "Thiếu họ tên";
    return null;
  },
);
