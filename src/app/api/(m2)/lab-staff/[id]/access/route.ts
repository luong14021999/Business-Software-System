import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/platform/db";
import { authorize, listUserRoles, rbacEnabled } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { deniedFromKeys, mergeRoles } from "@/lib/modules/m2/staff-access";

export const dynamic = "force-dynamic";

/**
 * Tab "Vai trò" và "Các quyền cụ thể" của nhân viên: ghi vai trò vào phân quyền tài khoản (theo email, giữ vai trò phân hệ khác)
 * và danh sách quyền bị chặn riêng. Chỉ Quản trị; phân quyền phải đã bật; không tước quyền Quản trị cuối cùng.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("admin.users");
  if (!gate.ok) return gate.response;
  if (!(await rbacEnabled())) return NextResponse.json({ error: "Chưa bật phân quyền – bật ở trang Quản trị → Phân quyền trước" }, { status: 409 });
  const { id } = await params;
  const s = (await staffStore.list()).find((x) => x.id === id);
  if (!s) return NextResponse.json({ error: "Không tìm thấy nhân viên" }, { status: 404 });
  const { roles = [], deny = [] } = (await req.json()) as { roles?: string[]; deny?: string[] };
  const email = s.email.trim().toLowerCase();
  const users = await listUserRoles();
  const before = users.find((u) => u.email.toLowerCase() === email);
  const next = mergeRoles(before?.roles ?? [], roles);
  const changes: { field: string; old: string; new: string }[] = [];
  if ((before?.roles ?? []).join(",") !== next.join(",")) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Nhân viên chưa có email đăng nhập – nhập email ở tab Thông tin chính" }, { status: 400 });
    const otherAdmins = users.filter((u) => u.active && u.roles.includes("Quản trị") && u.email.toLowerCase() !== email);
    if (!otherAdmins.length && !next.includes("Quản trị")) return NextResponse.json({ error: "Phải còn ít nhất 1 tài khoản Quản trị đang hoạt động" }, { status: 409 });
    await dbQuery(
      `insert into public.user_roles (email, full_name, roles, active, updated_by, updated_at) values ($1, $2, $3::jsonb, true, $4, now())
       on conflict (email) do update set roles = excluded.roles, full_name = coalesce(public.user_roles.full_name, excluded.full_name), updated_by = excluded.updated_by, updated_at = now()`,
      [email, s.fullName, JSON.stringify(next), gate.actor.name],
    );
    changes.push({ field: "vai trò", old: (before?.roles ?? []).join(", "), new: next.join(", ") });
  }
  const denied = deniedFromKeys(deny);
  if ((s.denied ?? []).slice().sort().join(",") !== denied.slice().sort().join(",")) {
    await staffStore.update(id, { denied });
    changes.push({ field: "quyền bị chặn", old: (s.denied ?? []).join(", "), new: denied.join(", ") });
  }
  if (changes.length) await logChange({ entity: "user-roles", entityId: id, action: "Sửa phân quyền", label: `${s.fullName}${email ? ` (${email})` : ""}`, changes });
  return NextResponse.json({ ok: true, roles: next, denied });
}
