import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XActionLinks, XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { btn } from "@/components/m2/lab-ui/page";
import { CopyLink } from "@/components/m2/settings/copy-link";
import { standardStore } from "@/lib/modules/m2/data/catalogs";
import { sampleTypeStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; standard?: string; page?: string };

/** Danh sách cột quy chuẩn như XaLab: Tên, Quy chuẩn, Loại mẫu; cuối dòng Chỉ tiêu | Xóa | Copy. */
export default async function SpecificationsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [specs, types, standards, access] = await Promise.all([specificationStore.list(), sampleTypeStore.list(), standardStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const stdName = new Map(standards.map((s) => [s.id, s.name]));
  const q = normalizeVi(sp.q ?? "");
  const rows = specs
    .map((s) => ({ ...s, title: s.columnName || s.name, std: stdName.get(s.standardId) ?? s.name }))
    .filter((s) => !sp.status || (sp.status === "dang-dung" ? s.active : !s.active))
    .filter((s) => !sp.standard || s.standardId === sp.standard)
    .filter((s) => !q || normalizeVi(`${s.title} ${s.std}`).includes(q))
    .sort((a, b) => a.title.localeCompare(b.title, "vi", { numeric: true }) || a.std.localeCompare(b.std, "vi"));
  const { page, pages, slice } = paginate(rows, sp);
  const url = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, page: undefined, ...patch }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/specifications${p.size ? `?${p}` : ""}`;
  };
  return (
    <XListPage
      title="Danh sách cột quy chuẩn"
      basePath="/specifications"
      sp={sp}
      newHref={canWrite ? "/specifications/new" : undefined}
      headers={["Tên", "Quy chuẩn", "Loại mẫu"]}
      searchPlaceholder="Tên hoặc quy chuẩn..."
      extraFilters={
        sp.standard ? (
          <Dropdown filter className={`${btn} -ml-px rounded-none last:rounded-r`} label={`Quy chuẩn: ${stdName.get(sp.standard) ?? ""}`} items={[{ label: "Tất cả", href: url({ standard: undefined }) }]} />
        ) : undefined
      }
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((s, i) => ({
        id: s.id,
        no: (page - 1) * 10 + i + 1,
        href: `/specifications/${s.id}/edit`,
        cells: [<span key="t" className={s.active ? undefined : "line-through"}>{s.title}</span>, s.std, typeName.get(s.sampleTypeId) ?? ""],
        actions: (
          <XActionLinks
            links={[{ label: "Chỉ tiêu", href: `/specifications/${s.id}`, icon: "list" }]}
            del={canWrite ? <span className="inline-flex items-center gap-2"><XDeleteLink url={`/api/specifications/${s.id}`} label={s.title} /><span className="text-[#333]">|</span><CopyLink url={`/api/specifications/${s.id}/copy`} openBase="/specifications" label={`cột quy chuẩn "${s.title}" kèm giới hạn các chỉ tiêu`} /></span> : undefined}
          />
        ),
      }))}
    />
  );
}
