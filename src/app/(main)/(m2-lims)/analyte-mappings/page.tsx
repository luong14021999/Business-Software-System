import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { analyteStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { analyteMappingStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Danh sách chỉ tiêu phụ như XaLab: chỉ tiêu chính, loại mẫu, phương pháp, các chỉ tiêu phụ. */
export default async function MappingsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const [maps, analytes, types, access] = await Promise.all([analyteMappingStore.list(), analyteStore.list(), sampleTypeStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  const name = new Map(analytes.map((a) => [a.id, a.name]));
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const q = normalizeVi(sp.q ?? "");
  const rows = maps
    .map((m) => ({ ...m, main: name.get(m.mainAnalyteId) ?? "", acc: m.accessoryIds.map((i) => name.get(i) ?? "").filter(Boolean).join(", ") }))
    .filter((m) => !q || normalizeVi(`${m.main} ${m.method} ${m.acc}`).includes(q))
    .sort((a, b) => a.main.localeCompare(b.main, "vi"));
  const { page, pages, slice } = paginate(rows, sp);
  return (
    <XListPage
      title="Danh sách chỉ tiêu phụ"
      basePath="/analyte-mappings"
      sp={sp}
      newHref={canWrite ? "/analyte-mappings/new" : undefined}
      statusFilter={false}
      headers={["Chỉ tiêu chính", "Loại mẫu", "Phương pháp phân tích", "Chỉ tiêu phụ"]}
      searchPlaceholder="Tên chỉ tiêu hoặc phương pháp..."
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((m, i) => ({
        id: m.id,
        no: (page - 1) * 10 + i + 1,
        href: `/analyte-mappings/${m.id}`,
        cells: [m.main, typeName.get(m.sampleTypeId) ?? "", m.method || "Mọi phương pháp", <span key="a">{m.acc}{m.hideAccessory && <span className="text-[#777]"> (ẩn)</span>}</span>],
        actions: canWrite ? <XDeleteLink url={`/api/analyte-mappings/${m.id}`} label={`chỉ tiêu phụ của ${m.main}`} /> : null,
      }))}
    />
  );
}
