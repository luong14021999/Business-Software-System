import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { btn } from "@/components/m2/lab-ui/page";
import { sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { bulkTemplateStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; type?: string; page?: string };

/** Danh sách template bóc tách như XaLab: Tên, Loại mẫu, Mô tả; lọc trạng thái / loại mẫu. */
export default async function BulkTemplatesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [items, types, access] = await Promise.all([bulkTemplateStore.list(), sampleTypeStore.list(), currentAccess()]);
  const canWrite = access.can("write.reception");
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const q = normalizeVi(sp.q ?? "");
  const rows = items
    .filter((t) => !sp.status || (sp.status === "dang-dung" ? t.active : !t.active))
    .filter((t) => !sp.type || t.sampleTypeId === sp.type)
    .filter((t) => !q || normalizeVi(t.name).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const { page, pages, slice } = paginate(rows, sp);
  const url = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, page: undefined, ...patch }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/bulk-templates${p.size ? `?${p}` : ""}`;
  };
  return (
    <XListPage
      title="Danh sách template"
      basePath="/bulk-templates"
      sp={sp}
      newHref={canWrite ? "/bulk-templates/new" : undefined}
      headers={["Tên", "Loại mẫu", "Mô tả"]}
      searchPlaceholder="Tên template..."
      extraFilters={<Dropdown filter className={`${btn} -ml-px rounded-none last:rounded-r`} label={`Loại mẫu: ${typeName.get(sp.type ?? "") ?? "Tất cả"}`} items={[{ label: "Tất cả", href: url({ type: undefined }), active: !sp.type }, ...types.map((t) => ({ label: t.name, href: url({ type: t.id }), active: sp.type === t.id }))]} />}
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((t, i) => ({
        id: t.id,
        no: (page - 1) * 10 + i + 1,
        href: `/bulk-templates/${t.id}`,
        cells: [<span key="n" className={t.active ? undefined : "line-through"}>{t.name}</span>, typeName.get(t.sampleTypeId) ?? "", t.description],
        actions: canWrite ? <XDeleteLink url={`/api/bulk-templates/${t.id}`} label={t.name} /> : null,
      }))}
    />
  );
}
