import Link from "next/link";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XActionLinks, XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { btn } from "@/components/m2/lab-ui/page";
import { analyteStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { analyteGroupStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; type?: string; group?: string; page?: string };

/** Danh sách chỉ tiêu phân tích như XaLab: lọc trạng thái / loại mẫu / loại chỉ tiêu, Copy, Xóa, Xuất / Nhập Excel. */
export default async function AnalytesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [items, types, groups, access] = await Promise.all([analyteStore.list(), sampleTypeStore.list(), analyteGroupStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, "vi", { numeric: true }) || (typeName.get(a.sampleTypeId) ?? "").localeCompare(typeName.get(b.sampleTypeId) ?? "", "vi"));
  const no = new Map(sorted.map((a, i) => [a.id, i + 1]));
  const q = normalizeVi(sp.q ?? "");
  const rows = sorted
    .filter((a) => !sp.status || (sp.status === "dang-dung" ? a.active : !a.active))
    .filter((a) => !sp.type || a.sampleTypeId === sp.type)
    .filter((a) => !sp.group || a.groupName === sp.group)
    .filter((a) => !q || normalizeVi(`${a.name} ${a.printName} ${a.abbreviation}`).includes(q));
  const { page, pages, slice } = paginate(rows, sp);
  const url = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, page: undefined, ...patch }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/lab-analytes${p.size ? `?${p}` : ""}`;
  };
  const joined = `${btn} -ml-px rounded-none`;
  return (
    <XListPage
      title="Danh sách chỉ tiêu phân tích"
      basePath="/lab-analytes"
      sp={sp}
      newHref={canWrite ? "/lab-analytes/new" : undefined}
      headers={["Tên", "Loại mẫu", "Nhóm chỉ tiêu", "Thứ tự"]}
      showIndex
      searchPlaceholder="Tên chỉ tiêu..."
      extraFilters={
        <>
          <Dropdown filter className={joined} label={`Loại mẫu: ${typeName.get(sp.type ?? "") ?? "Tất cả"}`} items={[{ label: "Tất cả", href: url({ type: undefined }), active: !sp.type }, ...types.map((t) => ({ label: t.name, href: url({ type: t.id }), active: sp.type === t.id }))]} />
          <Dropdown filter className={`${joined} rounded-r`} label={`Loại chỉ tiêu: ${sp.group || "Tất cả"}`} items={[{ label: "Tất cả", href: url({ group: undefined }), active: !sp.group }, ...groups.sort((a, b) => a.sort - b.sort).map((g) => ({ label: g.name, href: url({ group: g.name }), active: sp.group === g.name }))]} />
        </>
      }
      extraToolbar={
        <>
          <Link href="/lab-analytes/export" className={btn}>Xuất Excel</Link>
          {canWrite && <Link href="/lab-analytes/import" className={btn}>Nhập Excel</Link>}
        </>
      }
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((a) => ({
        id: a.id,
        no: no.get(a.id) ?? 0,
        href: `/lab-analytes/${a.id}`,
        cells: [<span key="n" className={a.active ? undefined : "line-through"}>{a.name}</span>, typeName.get(a.sampleTypeId) ?? "", a.groupName, a.sort || ""],
        actions: canWrite ? <XActionLinks links={[{ label: "Copy", href: `/lab-analytes/new?copy=${a.id}`, icon: "copy" }]} del={<XDeleteLink url={`/api/lab-analytes/${a.id}`} label={a.name} />} /> : null,
      }))}
    />
  );
}
