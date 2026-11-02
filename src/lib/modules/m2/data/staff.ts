import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { staff, type Staff } from "@/lib/mock-data";

const SELECT =
  "id, code, full_name, position, department, email, phone, joined_at, competencies, trainings, status, salutation, phone2, sign_for, collaborator, department_id, denied";

export const staffStore = createEntityStore<Staff>("staff", staff, {
  table: "staff",
  select: SELECT,
  toEntity: (row) => ({
    id: row.id as string,
    code: (row.code as string) ?? "",
    fullName: (row.full_name as string) ?? "",
    position: (row.position as string) ?? "",
    department: (row.department as string) ?? "",
    email: (row.email as string) ?? "",
    phone: (row.phone as string) ?? "",
    joinedAt: (row.joined_at as string) ?? "",
    competencies: (row.competencies as string[]) ?? [],
    trainings: (row.trainings as { name: string; year: number }[]) ?? [],
    status: (row.status as Staff["status"]) ?? "Đang làm việc",
    salutation: (row.salutation as string) ?? "",
    phone2: (row.phone2 as string) ?? "",
    signFor: (row.sign_for as string) ?? "",
    collaborator: Boolean(row.collaborator),
    departmentId: (row.department_id as string) ?? "",
    denied: (row.denied as string[]) ?? [],
  }),
  toRow: (s) => {
    const r: Record<string, unknown> = {};
    if (s.code !== undefined) r.code = s.code;
    if (s.fullName !== undefined) r.full_name = s.fullName;
    if (s.position !== undefined) r.position = s.position;
    if (s.department !== undefined) r.department = s.department;
    if (s.email !== undefined) r.email = s.email;
    if (s.phone !== undefined) r.phone = s.phone;
    if (s.joinedAt !== undefined) r.joined_at = dateOrNull(s.joinedAt);
    if (s.competencies !== undefined) r.competencies = s.competencies;
    if (s.trainings !== undefined) r.trainings = s.trainings;
    if (s.status !== undefined) r.status = s.status;
    if (s.salutation !== undefined) r.salutation = s.salutation;
    if (s.phone2 !== undefined) r.phone2 = s.phone2;
    if (s.signFor !== undefined) r.sign_for = s.signFor;
    if (s.collaborator !== undefined) r.collaborator = s.collaborator;
    if (s.departmentId !== undefined) r.department_id = s.departmentId || null;
    if (s.denied !== undefined) r.denied = JSON.stringify(s.denied);
    return r;
  },
});
