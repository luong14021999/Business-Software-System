import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { contactStore } from "@/lib/modules/m2/data/order-extras";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Danh sách liên lạc của khách hàng. */
export default async function ContactsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; page?: string }> }) {
  const denied = await pageGate("view.customers");
  if (denied) return denied;
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const ctx = await customerContext(id);
  if (!ctx) notFound();
  const q = normalizeVi(sp.q ?? "");
  const rows = (await contactStore.list()).filter((c) => c.customerId === id && (!q || normalizeVi(`${c.name} ${c.phone} ${c.email}`).includes(q))).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const { page, pages, slice } = paginate(rows, sp);
  const base = `/customers/${id}/contacts`;
  return (
    <XListPage
      title={`Danh sách liên lạc của ${ctx.customer.name}`}
      basePath={base}
      sp={sp}
      backHref="/customers"
      newHref={ctx.canWrite ? `${base}/new` : undefined}
      statusFilter={false}
      searchPlaceholder="Tìm kiếm..."
      headers={["Họ và tên", "Chức danh", "Phòng", "Số điện thoại", "Email"]}
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((c, i) => ({
        id: c.id,
        no: i + 1,
        href: `${base}/${c.id}`,
        cells: [[c.salutation, c.name].filter(Boolean).join(" "), c.title, c.department, [c.phone, c.phone2].filter(Boolean).join(" · "), c.email],
        actions: ctx.canWrite ? <XDeleteLink url={`/api/customer-contacts/${c.id}`} label={c.name} /> : undefined,
      }))}
    />
  );
}
