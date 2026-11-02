import Link from "next/link";
import { notFound } from "next/navigation";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { link } from "@/components/m2/lab-ui/page";
import { catalogOf, decorate } from "@/lib/modules/m2/catalog-registry";
import { currentAccess } from "@/lib/platform/data/access";
import { permissionForEntity } from "@/lib/platform/permissions";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; page?: string };

/** Danh sách một danh mục Cài đặt (khai báo trong catalog-registry) theo kiểu XaLab. */
export default async function CatalogListPage({ params, searchParams }: { params: Promise<{ catalog: string }>; searchParams: Promise<SP> }) {
  const [{ catalog }, sp] = await Promise.all([params, searchParams]);
  const def = catalogOf(catalog);
  if (!def) notFound();
  const [all, access] = await Promise.all([def.store.list(), currentAccess()]);
  const canWrite = access.can(permissionForEntity(def.store.collection));
  const q = normalizeVi(sp.q ?? "");
  // Số thứ tự cố định theo tên (như mã số của XaLab) để cột # không đổi khi lọc.
  const mine = (await decorate(all.filter((r) => !def.filter || def.filter(r)))).sort(def.sort ?? ((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "vi")));
  const no = new Map(mine.map((r, i) => [r.id, i + 1]));
  const rows = mine
    .filter((r) => !def.activeKey || !sp.status || (sp.status === "dang-dung" ? r[def.activeKey] : !r[def.activeKey]))
    .filter((r) => !q || normalizeVi(def.search ? def.search(r) : String(r.name ?? "")).includes(q));
  const { page, pages, slice } = paginate(rows, sp);
  return (
    <XListPage
      title={def.listTitle}
      basePath={`/${def.slug}`}
      sp={sp}
      newHref={canWrite ? `/${def.slug}/new` : undefined}
      headers={def.columns.map((c) => c.label)}
      showIndex={def.showIndex}
      searchPlaceholder={def.searchPlaceholder}
      statusFilter
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((r) => ({
        id: r.id,
        no: no.get(r.id) ?? 0,
        href: `/${def.slug}/${r.id}`,
        cells: def.columns.map((c) => c.get(r)),
        actions: (
          <span className="inline-flex items-center gap-2">
            {(def.rowLinks?.(r) ?? []).map((l) => (
              <span key={l.href} className="inline-flex items-center gap-2"><Link href={l.href} className={link}>{l.label}</Link><span className="text-[#ccc]">|</span></span>
            ))}
            {canWrite && <XDeleteLink url={`/api/catalog/${def.slug}/${r.id}`} label={String(r.name ?? "")} />}
          </span>
        ),
      }))}
    />
  );
}
