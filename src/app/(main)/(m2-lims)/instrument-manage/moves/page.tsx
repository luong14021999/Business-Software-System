import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { LabPage, Pager, btn, input, link, table } from "@/components/m2/lab-ui/page";
import { XTabs } from "@/components/m2/lab-ui/x-tabs";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { paginate } from "@/components/m2/lab-ui/x-list";
import { INSTRUMENT_TABS } from "@/components/m2/manage/instrument-data";
import { instrumentMoveStore, moveItemCounts } from "@/lib/modules/m2/data/manage";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** Danh sách phiếu nhập kho / xuất kho thiết bị (tab của trang Hiệu chuẩn/Tồn kho). */
export default async function InstrumentMovesPage({ searchParams }: { searchParams: Promise<{ kind?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const kind = sp.kind === "xuat" ? "xuat" : "nhap";
  const [moves, counts, orders, access] = await Promise.all([instrumentMoveStore.list(), moveItemCounts(), orderStore.list(), currentAccess()]);
  const orderCode = new Map(orders.map((o) => [o.id, o.code]));
  const q = (sp.q ?? "").trim();
  const all = moves.filter((m) => m.kind === kind).sort((a, b) => b.movedAt.localeCompare(a.movedAt) || b.createdAt.localeCompare(a.createdAt));
  const no = new Map([...all].reverse().map((m, i) => [m.id, i + 1]));
  const rows = all.filter((m) => !q || String(no.get(m.id)) === q || fmtDateVN(m.movedAt).includes(q));
  const { page, pages, slice } = paginate(rows, sp);
  const canWrite = access.can("write.lab");
  const label = kind === "xuat" ? "Xuất kho" : "Nhập kho";
  return (
    <LabPage title={`${label} thiết bị`}>
      <XTabs tabs={INSTRUMENT_TABS} active={`/instrument-manage/moves?kind=${kind}`} />
      <div className="flex flex-wrap items-center gap-1">
        {canWrite && <Link href={`/instrument-manage/moves/new?kind=${kind}`} className={btn}>Thêm <Plus className="h-4 w-4 stroke-[3]" /></Link>}
        <form action="/instrument-manage/moves" className="flex">
          <input type="hidden" name="kind" value={kind} />
          <input name="q" defaultValue={q} placeholder="ID hoặc ngày/tháng/năm" aria-label="Tìm kiếm" className={`${input} !w-48 rounded-r-none`} />
          <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
        </form>
      </div>
      <hr className="my-5 border-[#eee]" />
      <table className={table}>
        <thead><tr><th>ID</th><th>Ngày {kind === "xuat" ? "xuất" : "nhập"} kho</th>{kind === "xuat" && <th>Đơn hàng</th>}<th>Số thiết bị</th><th>Người giao</th><th>Người nhận</th><th /></tr></thead>
        <tbody>
          {slice.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>}
          {slice.map((m) => (
            <tr key={m.id}>
              <td><Link href={`/instrument-manage/moves/${m.id}`} className={link}>{no.get(m.id)}</Link></td>
              <td>{fmtDateVN(m.movedAt)}</td>
              {kind === "xuat" && <td>{orderCode.get(m.orderId) ?? ""}</td>}
              <td>{counts.get(m.id) ?? 0}</td>
              <td>{m.deliverer}</td>
              <td>{m.receiver}</td>
              <td className="text-right">{canWrite && <XDeleteLink url={`/api/instrument-moves/${m.id}`} label={`${label} ngày ${fmtDateVN(m.movedAt)}`} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5"><Pager page={rows.length ? page : 0} pages={pages} href={(p) => `/instrument-manage/moves?kind=${kind}${q ? `&q=${encodeURIComponent(q)}` : ""}&page=${p}`} /></div>
    </LabPage>
  );
}
