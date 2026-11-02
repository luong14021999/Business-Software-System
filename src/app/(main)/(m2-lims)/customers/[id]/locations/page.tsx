import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XActionLinks, XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { locationStore } from "@/lib/modules/m2/data/order-extras";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Danh sách địa điểm của khách hàng: Lịch quan trắc | Vị trí quan trắc | Xóa. */
export default async function LocationsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; page?: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const ctx = await customerContext(id);
  if (!ctx) notFound();
  const q = normalizeVi(sp.q ?? "");
  const rows = (await locationStore.list()).filter((l) => l.customerId === id && (!q || normalizeVi(`${l.name} ${l.oldName}`).includes(q))).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const { page, pages, slice } = paginate(rows, sp);
  const base = `/customers/${id}/locations`;
  return (
    <XListPage
      title={`Danh sách địa điểm của ${ctx.customer.name}`}
      basePath={base}
      sp={sp}
      backHref="/customers"
      newHref={ctx.canWrite ? `${base}/new` : undefined}
      statusFilter={false}
      searchPlaceholder="Tìm kiếm..."
      headers={["Tên địa điểm", "Tên địa điểm trước 1/7/2025", "Mô tả"]}
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((l, i) => ({
        id: l.id,
        no: i + 1,
        href: `${base}/${l.id}`,
        cells: [l.name, l.oldName, l.description],
        actions: (
          <XActionLinks
            links={[
              { label: "Lịch quan trắc", href: `${base}/${l.id}/schedules`, icon: "calendar" },
              { label: "Vị trí quan trắc", href: `${base}/${l.id}/points`, icon: "list" },
            ]}
            del={ctx.canWrite ? <XDeleteLink url={`/api/customer-locations/${l.id}`} label={l.name} /> : undefined}
          />
        ),
      }))}
    />
  );
}
