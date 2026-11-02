import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { pointStore } from "@/lib/modules/m2/data/order-extras";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Danh sách vị trí lấy mẫu của một địa điểm. */
export default async function PointsPage({ params, searchParams }: { params: Promise<{ id: string; locId: string }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const [{ id, locId }, sp] = await Promise.all([params, searchParams]);
  const ctx = await customerContext(id, locId);
  if (!ctx?.location) notFound();
  const q = normalizeVi(sp.q ?? "");
  const rows = (await pointStore.list())
    .filter((p) => p.locationId === locId)
    .filter((p) => !sp.status || (sp.status === "dang-dung" ? p.active !== false : p.active === false))
    .filter((p) => !q || normalizeVi(p.name).includes(q))
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "vi"));
  const { page, pages, slice } = paginate(rows, sp);
  const base = `/customers/${id}/locations/${locId}/points`;
  return (
    <XListPage
      title={`Danh sách vị trí lấy mẫu ở ${ctx.location.name}`}
      basePath={base}
      sp={sp}
      backHref={`/customers/${id}/locations`}
      newHref={ctx.canWrite ? `${base}/new` : undefined}
      searchPlaceholder="Tên vị trí lấy mẫu..."
      headers={["Tên", "Thứ tự", "Mô tả"]}
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((p, i) => ({
        id: p.id,
        no: i + 1,
        href: `${base}/${p.id}`,
        cells: [p.name, p.sort, [p.description, p.lat != null && p.lng != null ? `(${p.lat}, ${p.lng})` : ""].filter(Boolean).join(" ")],
        actions: ctx.canWrite ? <XDeleteLink url={`/api/monitoring-points/${p.id}`} label={p.name} /> : undefined,
      }))}
    />
  );
}
