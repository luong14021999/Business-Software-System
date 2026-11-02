import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XActionLinks, XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { btn } from "@/components/m2/lab-ui/page";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { ScheduleExport } from "@/components/m2/customers/schedule-export";
import { customerProfileStore } from "@/lib/modules/m2/data/customers";
import { currentAccess } from "@/lib/platform/data/access";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; page?: string };
/** File tải về (API), không phải trang. */
const EXPORT_URL = "/api/customer-profiles/export";

/** Danh sách khách hàng như XaLab: # · Tên · Mã · Điện thoại · Liên lạc | Địa điểm | Hợp đồng | Copy | Xóa; cuối trang "Tần suất quan trắc". */
export default async function CustomersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const [sp, all, access] = await Promise.all([searchParams, customerProfileStore.list(), currentAccess()]);
  const canWrite = access.can("write.reception");
  // Số # cố định theo thứ tự tạo (khách hàng đầu tiên = 1) như mã số của XaLab.
  const ordered = [...all].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "") || a.code.localeCompare(b.code));
  const no = new Map(ordered.map((c, i) => [c.id, i + 1]));
  const q = normalizeVi(sp.q ?? "");
  const rows = all
    .filter((c) => !sp.status || (sp.status === "dang-dung" ? c.active !== false : c.active === false))
    .filter((c) => !q || normalizeVi(`${c.name} ${c.code} ${c.taxCode}`).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const { page, pages, slice } = paginate(rows, sp);
  return (
    <XListPage
      title="Danh sách khách hàng"
      basePath="/customers"
      sp={sp}
      newHref={canWrite ? "/customers/new" : undefined}
      headers={["Tên khách hàng", "Mã khách hàng", "Số điện thoại"]}
      showIndex
      searchPlaceholder="Tên hoặc mã..."
      extraToolbar={<a href={EXPORT_URL} className={btn}>Xuất Excel</a>}
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((c) => ({
        id: c.id,
        no: no.get(c.id) ?? 0,
        href: `/customers/${c.id}`,
        cells: [<span key="n" className={c.active === false ? "line-through" : undefined}>{c.name}</span>, c.code, c.phone],
        actions: (
          <XActionLinks
            links={[
              { label: "Liên lạc", href: `/customers/${c.id}/contacts`, icon: "list" },
              { label: "Địa điểm", href: `/customers/${c.id}/locations`, icon: "list" },
              { label: "Hợp đồng", href: `/customers/${c.id}/contracts`, icon: "list" },
              ...(canWrite ? [{ label: "Copy", href: `/customers/new?copy=${c.id}`, icon: "copy" as const }] : []),
            ]}
            del={canWrite ? <XDeleteLink url={`/api/customer-profiles/${c.id}`} label={c.name} /> : undefined}
          />
        ),
      }))}
      footer={<ScheduleExport customers={[...all].sort((a, b) => a.name.localeCompare(b.name, "vi")).map((c) => ({ value: c.id, label: c.name }))} />}
    />
  );
}
