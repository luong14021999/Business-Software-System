// Kiểm soát truy cập theo vai trò phía server (§7.11.3) + xác thực lại khi ký điện tử (M2.6).
import { NextResponse } from "next/server";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { auth, currentActor, getSessionSafe } from "@/lib/platform/auth/server";
import { PERMISSIONS, roleAllows, type Permission, type Role } from "@/lib/platform/permissions";

export type UserRole = {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  active: boolean;
  note: string;
  updatedBy: string;
  updatedAt: string;
};

export async function listUserRoles(): Promise<UserRole[]> {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select id, email, full_name, roles, active, note, updated_by, updated_at from public.user_roles order by email`,
  );
  return rows.map((r) => ({
    id: r.id as string,
    email: r.email as string,
    fullName: (r.full_name as string) ?? "",
    roles: (r.roles as Role[]) ?? [],
    active: Boolean(r.active),
    note: (r.note as string) ?? "",
    updatedBy: (r.updated_by as string) ?? "",
    updatedAt: (r.updated_at as string) ?? "",
  }));
}

/** Chưa có dòng nào trong user_roles = chưa bật phân quyền (mọi tài khoản đăng nhập có toàn quyền). */
export async function rbacEnabled() {
  if (!isDbConfigured()) return false;
  const [r] = await dbQuery(`select count(*)::int n from public.user_roles`);
  return Number(r?.n ?? 0) > 0;
}

export async function rolesOf(email: string): Promise<Role[]> {
  if (!isDbConfigured() || !email) return [];
  const [r] = await dbQuery(`select roles, active from public.user_roles where lower(email) = lower($1)`, [email]);
  return r && r.active ? ((r.roles as Role[]) ?? []) : [];
}

/** Người đang đăng nhập + vai trò + bộ kiểm tra quyền (dùng cho trang và API). */
export async function currentAccess() {
  const actor = await currentActor();
  const enabled = await rbacEnabled();
  const roles = actor ? await rolesOf(actor.email) : [];
  const can = (perm: Permission) => Boolean(actor) && (!enabled || roleAllows(roles, perm));
  return { actor, enabled, roles, can };
}

type Authorized = { ok: true; actor: NonNullable<Awaited<ReturnType<typeof currentActor>>>; roles: Role[] };
type Denied = { ok: false; response: NextResponse };

/** Dùng trong route handler: trả 401/403 nếu không có quyền. */
export async function authorize(perm: Permission): Promise<Authorized | Denied> {
  const { actor, enabled, roles, can } = await currentAccess();
  if (!actor) return { ok: false, response: NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 }) };
  if (!can(perm)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Tài khoản ${actor.name} (${roles.length ? roles.join(", ") : "chưa được phân vai trò"}) không có quyền: ${PERMISSIONS[perm].label}`,
          code: "FORBIDDEN",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true, actor, roles: enabled ? roles : [] };
}

/** Dùng trong route handler chỉ đọc: chỉ cần đăng nhập (trang tương ứng không giới hạn quyền xem). */
export async function signedIn(): Promise<NextResponse | null> {
  const { actor } = await currentAccess();
  return actor ? null : NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
}

/** Thời gian tối đa từ lúc xác thực lại (nhập mật khẩu) đến lúc ký. */
export const SIGN_WINDOW_MINUTES = 5;

/**
 * Ký điện tử yêu cầu vừa xác thực lại bằng mật khẩu: phiên đăng nhập phải được tạo
 * trong SIGN_WINDOW_MINUTES phút gần nhất (giao diện đăng nhập lại ngay trước khi ký).
 */
export async function requireFreshAuth(): Promise<NextResponse | null> {
  if (!auth) return null;
  const { data } = await getSessionSafe();
  const created = data?.session?.createdAt ? new Date(data.session.createdAt).getTime() : 0;
  if (!created || Date.now() - created > SIGN_WINDOW_MINUTES * 60_000) {
    return NextResponse.json(
      { error: "Ký điện tử cần xác thực lại bằng mật khẩu", code: "REAUTH_REQUIRED" },
      { status: 401 },
    );
  }
  return null;
}
