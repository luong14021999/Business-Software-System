import { Search } from "lucide-react";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { AddStaffDialog } from "@/components/m2/staff/add-staff-dialog";
import { EditStaffDialog } from "@/components/m2/staff/edit-staff-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { LabPage, btn, input, table } from "@/components/m2/lab-ui/page";
import { currentAccess } from "@/lib/platform/data/access";
import { permissionForEntity } from "@/lib/platform/permissions";
import type { Staff } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

/** Màu chữ trạng thái nhân sự kiểu Bootstrap. */
const STATUS_COLOR: Record<Staff["status"], string> = {
  "Đang làm việc": "text-[#3c763d]",
  "Nghỉ phép": "text-[#8a6d3b]",
  "Thử việc": "text-[#777]",
};

/** Năng lực nhân sự PTN kiểu XaLab: danh sách nhân sự, nhóm chuyên môn, năng lực và đào tạo. */
export default async function PersonnelPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, access] = await Promise.all([staffStore.list(), currentAccess()]);
  const canWrite = access.can(permissionForEntity("staff"));
  const query = q.trim().toLowerCase();
  const staff = query
    ? all.filter((s) => [s.fullName, s.code, s.department, s.position].some((x) => x.toLowerCase().includes(query)))
    : all;
  const departments = Array.from(new Set(all.map((s) => s.department)));

  return (
    <LabPage
      title="Quản lý nhân sự PTN"
      rule={false}
      toolbar={
        <>
          {canWrite && <AddStaffDialog />}
          <form action="/personnel" className="flex">
            <input name="q" defaultValue={q} placeholder="Tìm tên, mã, nhóm..." aria-label="Tìm kiếm" className={`${input} !w-56 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
          </form>
        </>
      }
    >
      <p className="mb-3 text-sm text-[#555]">
        Tổng {all.length} nhân sự PTN · đang làm việc {all.filter((s) => s.status === "Đang làm việc").length} · {departments.length} nhóm chuyên môn · thử việc {all.filter((s) => s.status === "Thử việc").length}.
      </p>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr><th>Mã</th><th>Họ và tên</th><th>Chức danh</th><th>Nhóm chuyên môn</th><th>Email</th><th>Số điện thoại</th><th>Vào làm</th><th>Năng lực</th><th>Đào tạo</th><th>Trạng thái</th><th /></tr>
          </thead>
          <tbody>
            {staff.length === 0 && <tr><td colSpan={11} className="py-6 text-center text-muted-foreground">{query ? `Không có nhân sự nào khớp "${query}"` : "Chưa có nhân sự nào"}</td></tr>}
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="whitespace-nowrap">{s.code}</td>
                <td className="whitespace-nowrap font-bold">{s.fullName}</td>
                <td>{s.position}</td>
                <td>{s.department}</td>
                <td>{s.email}</td>
                <td className="whitespace-nowrap">{s.phone}</td>
                <td className="whitespace-nowrap">{s.joinedAt}</td>
                <td className="max-w-[220px] text-xs">{s.competencies.join("; ")}</td>
                <td className="max-w-[200px] text-xs">{s.trainings.map((t) => `${t.name} (${t.year})`).join("; ")}</td>
                <td className={`whitespace-nowrap ${STATUS_COLOR[s.status] ?? ""}`}>{s.status}</td>
                <td className="whitespace-nowrap">
                  {canWrite && (
                    <div className="flex items-center justify-end gap-1">
                      <EditStaffDialog row={s} />
                      <DeleteEntityButton entity="staff" id={s.id} label={s.fullName} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LabPage>
  );
}
