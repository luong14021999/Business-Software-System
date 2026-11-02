import { notFound } from "next/navigation";
import { pageGate } from "@/components/m2/lab-ui/page-gate";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { XListPage, paginate } from "@/components/m2/lab-ui/x-list";
import { contractStore } from "@/lib/modules/m2/data/catalogs";
import { customerContext } from "@/lib/modules/m2/data/customer-pages";
import { contractStatus } from "@/lib/modules/m2/customer-forms";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Danh sách hợp đồng của khách hàng; Trạng thái: Đang thực hiện / Đã thanh lý. */
export default async function ContractsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const denied = await pageGate("view.finance");
  if (denied) return denied;
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const ctx = await customerContext(id);
  if (!ctx) notFound();
  const today = todayISO();
  const q = normalizeVi(sp.q ?? "");
  const rows = (await contractStore.list())
    .filter((c) => c.customerId === id)
    .filter((c) => !sp.status || (sp.status === "dang-dung" ? contractStatus(c.liquidatedAt, today) === "Đang thực hiện" : contractStatus(c.liquidatedAt, today) === "Đã thanh lý"))
    .filter((c) => !q || normalizeVi(c.contractNo).includes(q))
    .sort((a, b) => (b.signedAt || "").localeCompare(a.signedAt || ""));
  const { page, pages, slice } = paginate(rows, sp);
  const base = `/customers/${id}/contracts`;
  return (
    <XListPage
      title={`Danh sách hợp đồng của ${ctx.customer.name}`}
      basePath={base}
      sp={sp}
      backHref="/customers"
      newHref={ctx.canWrite ? `${base}/new` : undefined}
      searchPlaceholder="Số hợp đồng..."
      headers={["Số hợp đồng", "Giá trị hợp đồng (đồng)", "Ngày ký", "Ngày thanh lý", "Trạng thái"]}
      total={rows.length}
      page={page}
      pages={pages}
      rows={slice.map((c, i) => ({
        id: c.id,
        no: i + 1,
        href: `${base}/${c.id}`,
        cells: [c.contractNo, c.value ? c.value.toLocaleString("vi-VN") : "", fmtDateVN(c.signedAt), fmtDateVN(c.liquidatedAt), contractStatus(c.liquidatedAt, today)],
        actions: ctx.canWrite ? <XDeleteLink url={`/api/customer-contracts/${c.id}`} label={c.contractNo} /> : undefined,
      }))}
    />
  );
}
