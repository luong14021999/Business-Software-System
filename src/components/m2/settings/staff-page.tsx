import { LabPage } from "@/components/m2/lab-ui/page";
import { StaffForm } from "@/components/m2/settings/staff-form";
import { departmentStore } from "@/lib/modules/m2/data/catalogs";
import { currentAccess, listUserRoles } from "@/lib/platform/data/access";
import { keysFromDenied } from "@/lib/modules/m2/staff-access";
import type { Staff } from "@/lib/mock-data";

/** Trang tạo / sửa nhân viên. */
export async function StaffPage({ s }: { s?: Staff }) {
  const [departments, access, users] = await Promise.all([departmentStore.list(), currentAccess(), listUserRoles()]);
  const user = s?.email ? users.find((u) => u.email.toLowerCase() === s.email.toLowerCase()) : undefined;
  return (
    <LabPage title={s ? s.fullName : "Tạo nhân viên"} subtitle={<span className="text-lg text-[#333]">Thông tin nhân viên</span>}>
      <StaffForm
        id={s?.id}
        initial={{ salutation: s?.salutation ?? "", fullName: s?.fullName ?? "", position: s?.position ?? "", departmentId: s?.departmentId ?? "", phone: s?.phone ?? "", phone2: s?.phone2 ?? "", signFor: s?.signFor ?? "", email: s?.email ?? "", collaborator: s?.collaborator ?? false }}
        roles={(user?.roles ?? []) as string[]}
        deny={keysFromDenied(s?.denied ?? [])}
        departments={departments.sort((a, b) => a.sort - b.sort).map((d) => ({ value: d.id, label: d.name }))}
        canWrite={access.can("write.personnel")}
        canAdmin={access.can("admin.users")}
      />
    </LabPage>
  );
}
