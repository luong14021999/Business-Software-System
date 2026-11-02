import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { CreateBatchButton } from "@/components/m2/settings/create-batch-button";
import { batchTemplateStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; page?: string };

/** Danh sách template mẻ thử nghiệm như XaLab: Tên, Người phân tích; thêm nút Tạo mẻ từ template. */
export default async function BatchTemplatesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [items, access] = await Promise.all([batchTemplateStore.list(), currentAccess()]);
  const canWrite = access.can("results.enter");
  const q = normalizeVi(sp.q ?? "");
  const rows = items
    .filter((t) => !sp.status || (sp.status === "dang-dung" ? t.active : !t.active))
    .filter((t) => !q || normalizeVi(t.name).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const { page, pages, slice } = paginate(rows, sp);
  return (
    <XListPage
      title="Danh sách template mẻ thử nghiệm"
      basePath="/batch-templates"
      sp={sp}
      newHref={canWrite ? "/batch-templates/new" : undefined}
      headers={["Tên", "Người phân tích"]}
      searchPlaceholder="Tên"
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((t, i) => ({
        id: t.id,
        no: (page - 1) * 10 + i + 1,
        href: `/batch-templates/${t.id}`,
        cells: [<span key="n" className={t.active ? undefined : "line-through"}>{t.name}</span>, t.analyst],
        actions: canWrite ? (
          <span className="inline-flex items-center gap-2">
            <CreateBatchButton templateId={t.id} />
            <span className="text-[#333]">|</span>
            <XDeleteLink url={`/api/batch-templates/${t.id}`} label={t.name} />
          </span>
        ) : null,
      }))}
    />
  );
}
