import Link from "next/link";
import { History } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { LabPage, Pager, btn, link, table } from "@/components/m2/lab-ui/page";
import { paginate } from "@/components/m2/lab-ui/x-list";
import { DeleteLatestNo } from "@/components/m2/settings/delete-latest-no";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { reportNumberStore } from "@/lib/modules/m2/data/report-numbers";
import { REPORT_NO_KINDS } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

type SP = { kind?: string; xoa?: string; page?: string };

/** Danh sách số phiếu kết quả như XaLab: lọc loại số phiếu, xóa số mới nhất, xem lịch sử xóa. */
export default async function ReportNumbersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const kind = (REPORT_NO_KINDS as readonly string[]).includes(sp.kind ?? "") ? sp.kind! : REPORT_NO_KINDS[0];
  const deleted = sp.xoa === "1";
  const [items, orders, access] = await Promise.all([reportNumberStore.list(), orderStore.list(), currentAccess()]);
  const order = new Map(orders.map((o) => [o.id, o]));
  const rows = items.filter((r) => r.kind === kind && Boolean(r.deletedAt) === deleted).sort((a, b) => b.year - a.year || b.startNo - a.startNo);
  const { page, pages, slice } = paginate(rows, sp);
  const url = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, page: undefined, ...patch }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/report-numbers${p.size ? `?${p}` : ""}`;
  };
  const canDelete = access.can("results.approve") || access.can("admin.users");
  return (
    <LabPage title={deleted ? "Lịch sử xóa số phiếu kết quả" : "Danh sách số phiếu kết quả"} rule={false}>
      <div className="mb-5 flex flex-wrap gap-1">
        <Dropdown filter className={btn} label={`Loại số phiếu: ${kind}`} items={REPORT_NO_KINDS.map((k) => ({ label: k, href: url({ kind: k }), active: k === kind }))} />
        {!deleted && canDelete && <DeleteLatestNo kind={kind} />}
        <Link href={url({ xoa: deleted ? undefined : "1" })} className={btn}>{deleted ? "Quay lại danh sách" : <>Xem lịch sử xóa <History className="h-4 w-4" /></>}</Link>
      </div>
      <table className={table}>
        <thead>
          <tr><th>Ngày tạo</th><th>Người dùng</th><th>Đơn hàng</th><th>Ngày trả kết quả</th><th>Năm</th><th>Bắt đầu từ số</th><th>Số lượng</th><th>Loại số phiếu</th>{deleted && <><th>Ngày xóa</th><th>Người xóa</th></>}</tr>
        </thead>
        <tbody>
          {slice.length === 0 && <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>}
          {slice.map((r) => {
            const o = order.get(r.orderId);
            return (
              <tr key={r.id}>
                <td><Link href={`/report-numbers/${r.id}`} className={link}>{fmtDateTimeVN(r.createdAt)}</Link></td>
                <td>{r.createdBy}</td>
                <td>{o ? <Link href={`/orders/${o.id}`} className={link}>{o.code} {o.name}</Link> : ""}</td>
                <td>{fmtDateTimeVN(o?.deliveredAt || o?.dueAt)}</td>
                <td>{r.year}</td><td>{r.startNo}</td><td>{r.quantity}</td><td>{r.kind}</td>
                {deleted && <><td>{fmtDateTimeVN(r.deletedAt)}</td><td>{r.deletedBy}</td></>}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-5"><Pager page={rows.length ? page : 0} pages={pages} href={(p) => `${url({})}${url({}).includes("?") ? "&" : "?"}page=${p}`} /></div>
      <p className="mt-4 text-sm text-[#777]">Cấp số phiếu ở trang sửa đơn hàng (tab Thông tin khác → “Cấp số phiếu tiếp theo”): số đánh liên tục theo năm và loại số phiếu.</p>
    </LabPage>
  );
}
