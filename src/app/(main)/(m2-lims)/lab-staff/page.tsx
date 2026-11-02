import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { currentAccess } from "@/lib/platform/data/access";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Danh sách nhân viên như XaLab: #, Họ và tên, Chức danh, Số điện thoại, Email. */
export default async function LabStaffPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const [staff, access] = await Promise.all([staffStore.list(), currentAccess()]);
  const canWrite = access.can("write.personnel");
  const sorted = [...staff].sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));
  const no = new Map(sorted.map((s, i) => [s.id, i + 1]));
  const q = normalizeVi(sp.q ?? "");
  const rows = sorted.filter((s) => !q || normalizeVi(`${s.fullName} ${s.email} ${s.position}`).includes(q));
  const { page, pages, slice } = paginate(rows, sp);
  return (
    <XListPage
      title="Danh sách nhân viên"
      basePath="/lab-staff"
      sp={sp}
      newHref={canWrite ? "/lab-staff/new" : undefined}
      statusFilter={false}
      showIndex
      headers={["Họ và tên", "Chức danh", "Số điện thoại", "Email"]}
      searchPlaceholder="Tên nhân viên..."
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((s) => ({
        id: s.id,
        no: no.get(s.id) ?? 0,
        href: `/lab-staff/${s.id}`,
        cells: [`${s.salutation ? `${s.salutation} ` : ""}${s.fullName}`, s.position, s.phone, s.email],
        actions: canWrite ? <XDeleteLink url={`/api/staff/${s.id}`} label={s.fullName} /> : null,
      }))}
    />
  );
}
