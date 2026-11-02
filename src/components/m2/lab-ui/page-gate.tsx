import { LabPage } from "@/components/m2/lab-ui/page";
import { currentAccess } from "@/lib/platform/data/access";
import { PERMISSIONS, type Permission } from "@/lib/platform/permissions";

/** Chặn trang M2 theo quyền xem: trả về trang báo không có quyền, hoặc null nếu được xem. */
export async function pageGate(perm: Permission) {
  const access = await currentAccess();
  if (access.can(perm)) return null;
  return (
    <LabPage title="Không có quyền xem trang này">
      <p className="text-sm text-muted-foreground">
        Tài khoản {access.actor?.name ?? ""} ({access.roles.length ? access.roles.join(", ") : "chưa được phân vai trò"}) không có quyền: {PERMISSIONS[perm].label}. Liên hệ Quản trị hệ thống nếu cần.
      </p>
    </LabPage>
  );
}
