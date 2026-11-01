import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { LabPage, Pager, btn, input } from "@/components/m2/lab-ui/page";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { OrdersTable, type OrderRow } from "@/components/m2/orders/orders-table";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { orderProgress, orderStore } from "@/lib/modules/m2/data/orders";
import { ORDER_STATUSES, overdueDays } from "@/lib/modules/m2/orders";
import { normalizeVi } from "@/lib/platform/format";
import { todayISO, vnDateOf } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;
const RESULT_FILTERS = ["Tất cả", "Chưa có kết quả", "Đang có kết quả", "Đủ kết quả nhưng chưa trả", "Đã trả kết quả"] as const;
const OVERDUE: Record<string, string> = { "quan-trac": "Quá hạn quan trắc", "tra-ket-qua": "Chậm trả kết quả" };

type SP = { q?: string; status?: string; kq?: string; quaHan?: string; page?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = sp.status ?? "";
  const kq = sp.kq ?? "Tất cả";
  const [orders, customers, progress] = await Promise.all([orderStore.list(), getCustomers(), orderProgress()]);
  const customerName = new Map(customers.map((c) => [c.id, c.name]));
  const today = todayISO();
  const q = normalizeVi(sp.q ?? "");

  const rows: OrderRow[] = orders
    .map((o) => {
      const p = progress.get(o.id) ?? { samples: 0, lines: 0, approved: 0 };
      return { ...o, customerName: customerName.get(o.customerId) ?? "", samples: p.samples, lines: p.lines, approved: p.approved };
    })
    .filter((o) => !status || o.status === status)
    .filter((o) => {
      if (kq === "Chưa có kết quả") return o.approved === 0;
      if (kq === "Đang có kết quả") return o.approved > 0 && o.approved < o.lines;
      if (kq === "Đủ kết quả nhưng chưa trả") return o.lines > 0 && o.approved === o.lines && o.status !== "Trả kết quả" && o.status !== "Thanh lý";
      if (kq === "Đã trả kết quả") return o.status === "Trả kết quả" || o.status === "Thanh lý";
      return true;
    })
    .filter((o) => {
      if (sp.quaHan === "quan-trac") return (o.status === "Báo giá" || o.status === "Quan trắc") && overdueDays(vnDateOf(o.fieldAt), today) > 0;
      if (sp.quaHan === "tra-ket-qua") return (o.status === "Quan trắc" || o.status === "Phân tích") && overdueDays(vnDateOf(o.dueAt), today) > 0;
      return true;
    })
    .filter((o) => !q || normalizeVi(`${o.code} ${o.name} ${o.customerName} ${o.requestingUnit} ${o.contractNo}`).includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.code.localeCompare(a.code, undefined, { numeric: true }));

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const url = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, page: undefined, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/orders${p.size ? `?${p}` : ""}`;
  };

  return (
    <LabPage
      title={sp.quaHan ? `Danh sách đơn hàng – ${OVERDUE[sp.quaHan] ?? ""}` : "Danh sách đơn hàng"}
      toolbar={
        <>
          <Link href="/orders/new" className={btn}>Thêm <Plus className="h-4 w-4" /></Link>
          <Dropdown
            className={btn}
            label={`Trạng thái: ${status || "Tất cả"}`}
            items={[{ label: "Tất cả", href: url({ status: undefined }), active: !status }, ...ORDER_STATUSES.map((s) => ({ label: s, href: url({ status: s }), active: status === s }))]}
          />
          <Dropdown className={btn} label={`Kết quả: ${kq}`} items={RESULT_FILTERS.map((k) => ({ label: k, href: url({ kq: k === "Tất cả" ? undefined : k }), active: kq === k }))} />
          <form action="/orders" className="flex">
            {status && <input type="hidden" name="status" value={status} />}
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Từ khóa tìm kiếm..." className={`${input} w-64 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4" /></button>
          </form>
          {sp.quaHan && <Link href="/orders" className="text-sm text-[#337ab7] hover:underline">Bỏ lọc quá hạn</Link>}
        </>
      }
    >
      <OrdersTable rows={rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)} />
      <Pager page={page} pages={pages} href={(p) => `${url({})}${url({}).includes("?") ? "&" : "?"}page=${p}`} />
    </LabPage>
  );
}
