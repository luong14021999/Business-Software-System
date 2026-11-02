import { Download } from "lucide-react";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { btn, link } from "@/components/m2/lab-ui/page";
import { vanBanStore } from "@/lib/modules/m2/data/manage";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateVN } from "@/lib/platform/dates";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

const EXPORT_URL = "/api/van-bans/export";

type SP = { q?: string; status?: string; page?: string };

/** Danh sách hồ sơ (văn bản) như XaLab: số văn bản, ngày ban hành, cơ quan ban hành, trích yếu, nhân viên được giao. */
export default async function VanBansPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [docs, access] = await Promise.all([vanBanStore.list(), currentAccess()]);
  const canWrite = access.can("write.lab");
  const q = normalizeVi(sp.q ?? "");
  const rows = docs
    .filter((d) => !sp.status || (sp.status === "dang-dung" ? d.active : !d.active))
    .filter((d) => !q || normalizeVi(`${d.number} ${d.summary} ${d.issuer}`).includes(q))
    .sort((a, b) => (b.issuedAt || "").localeCompare(a.issuedAt || "") || a.number.localeCompare(b.number, "vi"));
  const { page, pages, slice } = paginate(rows, sp);
  return (
    <XListPage
      title="Danh sách hồ sơ"
      basePath="/van-bans"
      sp={sp}
      newHref={canWrite ? "/van-bans/new" : undefined}
      headers={["Số văn bản", "Ngày ban hành", "Cơ quan ban hành", "Trích yếu", "Nhân viên được giao"]}
      searchPlaceholder="Số văn bản..."
      extraFilters={<a href={EXPORT_URL} className={`${btn} -ml-px rounded-none last:rounded-r`}>Xuất Excel <Download className="h-4 w-4" /></a>}
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((d, i) => ({
        id: d.id,
        no: (page - 1) * 10 + i + 1,
        href: `/van-bans/${d.id}`,
        cells: [d.number, fmtDateVN(d.issuedAt), d.issuer, d.summary, d.assignees.join(", ")],
        actions: (
          <span className="inline-flex items-center gap-2">
            {d.fileName && <><a href={`/api/van-bans/${d.id}/file`} className={link}>File</a><span className="text-[#ccc]">|</span></>}
            {canWrite && <XDeleteLink url={`/api/van-bans/${d.id}`} label={`hồ sơ ${d.number}`} />}
          </span>
        ),
      }))}
    />
  );
}
