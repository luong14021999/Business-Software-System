import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn, link, table } from "@/components/m2/lab-ui/page";
import { SignDialog } from "@/components/platform/sign/sign-dialog";
import { orderSampleStore, orderStore } from "@/lib/modules/m2/data/orders";
import { listReports } from "@/lib/modules/m2/data/reports";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/**
 * Phiếu kết quả có mã QR xác minh của đơn hàng: mỗi yêu cầu (mẫu) phát hành phiếu riêng (ký điện tử) từ các chỉ tiêu
 * đã duyệt đủ 3 cấp; in phiếu kèm QR, người nhận quét để kiểm tra phiếu còn hiệu lực và không bị sửa.
 */
export default async function OrderReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, samples, reports, access] = await Promise.all([orderStore.list(), orderSampleStore.list(), listReports(), currentAccess()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const mine = samples.filter((s) => s.orderId === id).sort((a, b) => a.code.localeCompare(b.code));
  const counts = new Map<string, { all: number; approved: number }>();
  if (isDbConfigured() && mine.length) {
    const rows = await dbQuery(
      `select sample_code, count(*)::int n, count(*) filter (where status = 'Đã duyệt')::int ok from public.analysis_results where sample_code = any($1::text[]) group by sample_code`,
      [mine.map((s) => s.code)],
    );
    for (const r of rows) counts.set(r.sample_code as string, { all: Number(r.n), approved: Number(r.ok) });
  }
  const email = access.actor?.email ?? "";
  const canIssue = access.can("reports.issue");
  const canRevoke = access.can("reports.revoke");
  return (
    <LabPage
      title="Phiếu kết quả có mã QR xác minh"
      subtitle={<span className="text-lg font-medium text-[#333]">{order.code} · {order.name}</span>}
      toolbar={<Link href={`/orders/${id}`} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>}
    >
      <p className="mb-4 text-sm text-[#555]">
        Phát hành phiếu cho từng yêu cầu khi các chỉ tiêu đã được duyệt đủ 3 cấp; phát hành lại tạo phiếu sửa đổi thay thế phiếu cũ. Phiếu in có mã QR để kiểm tra trực tuyến.
      </p>
      <table className={table}>
        <thead><tr><th>Mã mẫu</th><th>Vị trí / tên mẫu</th><th>Chỉ tiêu đã duyệt</th><th>Phiếu hiện hành</th><th>Ngày phát hành</th><th /></tr></thead>
        <tbody>
          {mine.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Đơn hàng chưa có yêu cầu</td></tr>}
          {mine.map((s) => {
            const c = counts.get(s.code) ?? { all: 0, approved: 0 };
            const history = reports.filter((r) => r.sampleCode === s.code).sort((a, b) => b.revision - a.revision);
            const active = history.find((r) => r.status === "Đã phát hành");
            return (
              <tr key={s.id}>
                <td className="whitespace-nowrap">{s.code}</td>
                <td>{s.locationName}</td>
                <td className={c.approved && c.approved === c.all ? "text-[#3c763d]" : undefined}>{c.approved} / {c.all}</td>
                <td>
                  {active ? <Link href={`/report-print/${active.id}`} className={link}>{active.code}{active.revision ? ` (sửa đổi ${active.revision})` : ""}</Link> : <span className="text-[#777]">Chưa phát hành</span>}
                  {history.filter((r) => r !== active).map((r) => (
                    <div key={r.id} className="text-xs text-[#777]"><Link href={`/report-print/${r.id}`} className="hover:underline">{r.code}</Link> – {r.status}</div>
                  ))}
                </td>
                <td className="whitespace-nowrap">{active ? fmtDateTimeVN(active.issuedAt) : ""}</td>
                <td className="whitespace-nowrap text-right">
                  <span className="inline-flex flex-wrap justify-end gap-1">
                    {canIssue && (
                      <SignDialog
                        email={email}
                        meaning="Phát hành phiếu kết quả"
                        title={`${active ? "Phát hành phiếu sửa đổi" : "Phát hành phiếu"} – ${s.code}`}
                        description="Phiếu lấy các chỉ tiêu đã duyệt đủ 3 cấp; nhập lại mật khẩu để ký."
                        endpoint="/api/test-reports"
                        extraBody={{ sampleCode: s.code }}
                        fields={[{ name: "note", label: active ? "Lý do sửa đổi" : "Ghi chú", required: Boolean(active) }]}
                        triggerLabel={active ? "Phát hành sửa đổi" : "Phát hành phiếu"}
                        disabled={!c.approved}
                        disabledReason="Chưa có chỉ tiêu nào được duyệt đủ 3 cấp"
                      />
                    )}
                    {active && <Link href={`/report-print/${active.id}`} className={btn}>In phiếu</Link>}
                    {active && canRevoke && (
                      <SignDialog
                        email={email}
                        meaning="Thu hồi phiếu kết quả"
                        title={`Thu hồi phiếu ${active.code}`}
                        endpoint={`/api/test-reports/${active.id}/revoke`}
                        fields={[{ name: "reason", label: "Lý do thu hồi", required: true }]}
                        triggerLabel="Thu hồi"
                        variant="danger"
                      />
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </LabPage>
  );
}
