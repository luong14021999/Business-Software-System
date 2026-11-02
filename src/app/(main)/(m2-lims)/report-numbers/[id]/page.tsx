import Link from "next/link";
import { notFound } from "next/navigation";
import { LabPage, btn, table } from "@/components/m2/lab-ui/page";
import { orderSampleStore, orderStore } from "@/lib/modules/m2/data/orders";
import { reportNumberStore } from "@/lib/modules/m2/data/report-numbers";
import { formatReportNo } from "@/lib/modules/m2/report-numbers";

export const dynamic = "force-dynamic";

/** Chi tiết số phiếu kết quả – yêu cầu: các yêu cầu (mẫu) của đơn hàng được cấp số. */
export default async function ReportNumberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = (await reportNumberStore.list()).find((x) => x.id === id);
  if (!r) notFound();
  const [orders, samples] = await Promise.all([orderStore.list(), orderSampleStore.list()]);
  const o = orders.find((x) => x.id === r.orderId);
  const mine = samples.filter((s) => s.orderId === r.orderId).sort((a, b) => a.code.localeCompare(b.code));
  return (
    <LabPage title="Chi tiết số phiếu kết quả - yêu cầu" subtitle={<span className="text-lg text-[#333]">{r.kind} {formatReportNo(r.startNo, r.quantity, r.year)}{o ? ` · đơn hàng ${o.code} ${o.name}` : ""}</span>}>
      <Link href={`/report-numbers?kind=${encodeURIComponent(r.kind)}`} className={btn}>Quay lại</Link>
      <table className={`${table} mt-4`}>
        <thead><tr><th>#</th><th>Mã mẫu</th><th>Vị trí / tên mẫu</th><th>Loại mẫu</th></tr></thead>
        <tbody>
          {mine.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>}
          {mine.map((s, i) => <tr key={s.id}><td>{i + 1}</td><td>{s.code}</td><td>{s.locationName}</td><td>{s.type}</td></tr>)}
        </tbody>
      </table>
    </LabPage>
  );
}
