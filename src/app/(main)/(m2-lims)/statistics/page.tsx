import { ClipboardList, Timer, CalendarCheck, Banknote } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatGrid } from "@/components/common/stat-grid";
import { Bars } from "@/components/common/bar-chart";
import { samplesStore } from "@/lib/modules/m2/data/samples";
import { listReports } from "@/lib/modules/m2/data/reports";
import { testRequestsStore } from "@/lib/modules/m2/data/test-requests";
import { countByMonth, lastMonths, median, monthKey, requestValue, turnaroundDays } from "@/lib/platform/stats";
import { todayISO } from "@/lib/platform/dates";
import { pageGate } from "@/components/m2/lab-ui/page-gate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thống kê" };

const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n));
const REVENUE_STATUSES = new Set(["KH chấp nhận", "Đã ký HĐ", "Đã nhận mẫu"]);

export default async function StatisticsPage() {
  const denied = await pageGate("view.stats");
  if (denied) return denied;
  const [samples, reports, requests] = await Promise.all([samplesStore.list(), listReports(), testRequestsStore.list()]);
  const today = todayISO();
  const months = lastMonths(today, 12);
  const thisMonth = months[months.length - 1];

  // Lần phát hành đầu tiên cho mỗi mẫu (không tính bản thay thế) → TAT.
  const firstIssue = new Map<string, string>();
  for (const r of reports) {
    const prev = firstIssue.get(r.sampleCode);
    if (r.issuedAt && (!prev || r.issuedAt < prev)) firstIssue.set(r.sampleCode, r.issuedAt);
  }
  const tat = samples
    .filter((s) => s.receivedAt && firstIssue.has(s.code))
    .map((s) => {
      const issued = firstIssue.get(s.code)!;
      const days = turnaroundDays(s.receivedAt, issued);
      const onTime = !s.dueAt || turnaroundDays(s.dueAt, issued) <= 0;
      return { code: s.code, type: s.type, month: monthKey(issued), days, onTime };
    });
  const tatMedian = median(tat.map((t) => t.days));
  const onTimePct = tat.length ? Math.round((tat.filter((t) => t.onTime).length / tat.length) * 100) : NaN;

  const received = countByMonth(samples.map((s) => s.receivedAt).filter(Boolean), months);
  const issued = countByMonth([...firstIssue.values()], months);
  const tatByMonth = months.map((m) => {
    const v = median(tat.filter((t) => t.month === m).map((t) => t.days));
    return Number.isNaN(v) ? 0 : v;
  });

  const valued = requests
    .filter((r) => REVENUE_STATUSES.has(r.status))
    .map((r) => ({ r, v: requestValue(r.criteria, r.expectedSamples, r.vatRate), month: monthKey(r.acceptedAt || r.createdAt) }));
  const revenue = months.map((m) => valued.filter((x) => x.month === m).reduce((s, x) => s + x.v.total, 0));
  const yearTotal = valued.filter((x) => x.month.startsWith(today.slice(0, 4))).reduce((s, x) => s + x.v.total, 0);

  const byType = Object.entries(
    samples.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.type || "Khác"]: (acc[s.type || "Khác"] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <Header title="Thống kê hoạt động" description="M2.7 – sản lượng mẫu, thời gian trả kết quả (TAT), tỷ lệ đúng hạn, doanh thu từ phiếu yêu cầu đã được chấp nhận" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Mẫu tháng này", value: received[received.length - 1], icon: ClipboardList, accent: "bg-blue-50 text-blue-600", hint: `${issued[issued.length - 1]} phiếu phát hành` },
            { label: "TAT trung vị", value: Number.isNaN(tatMedian) ? "—" : `${tatMedian} ngày`, icon: Timer, accent: "bg-amber-50 text-amber-600", hint: `${tat.length} mẫu đã trả KQ` },
            { label: "Đúng hạn", value: Number.isNaN(onTimePct) ? "—" : `${onTimePct}%`, icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-700", hint: "phiếu phát hành ≤ hạn trả" },
            { label: `Doanh thu ${today.slice(0, 4)}`, value: vnd(yearTotal), icon: Banknote, accent: "bg-violet-50 text-violet-600", hint: "VNĐ, gồm VAT" },
          ]}
        />
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Mẫu tiếp nhận theo tháng</CardTitle><CardDescription>12 tháng gần nhất · {thisMonth}</CardDescription></CardHeader>
            <CardContent><Bars months={months} values={received} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Phiếu kết quả phát hành theo tháng</CardTitle><CardDescription>Lần phát hành đầu tiên của mỗi mẫu</CardDescription></CardHeader>
            <CardContent><Bars months={months} values={issued} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">TAT trung vị theo tháng (ngày)</CardTitle><CardDescription>Ngày nhận mẫu → ngày phát hành phiếu, theo lịch</CardDescription></CardHeader>
            <CardContent><Bars months={months} values={tatByMonth} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Doanh thu theo tháng (VNĐ)</CardTitle><CardDescription>Σ đơn giá chỉ tiêu × số mẫu + VAT · phiếu KH chấp nhận / đã ký HĐ / đã nhận mẫu</CardDescription></CardHeader>
            <CardContent><Bars months={months} values={revenue} fmt={(n) => `${vnd(n / 1e6)}tr`} /></CardContent>
          </Card>
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Mẫu theo loại</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {byType.length === 0 && <div className="text-sm text-muted-foreground">Chưa có mẫu</div>}
              {byType.map(([t, n]) => (
                <div key={t} className="flex items-center gap-3 text-sm">
                  <span className="w-48 truncate">{t}</span>
                  <div className="flex-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${(n / byType[0][1]) * 100}%` }} /></div>
                  <span className="w-8 text-right font-medium">{n}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Mẫu trễ hạn đã trả kết quả</CardTitle></CardHeader>
            <CardContent>
              {tat.filter((t) => !t.onTime).length === 0 && <div className="text-sm text-muted-foreground">Không có mẫu trả trễ</div>}
              <ul className="space-y-1.5 text-sm">
                {tat.filter((t) => !t.onTime).map((t) => (
                  <li key={t.code} className="flex justify-between gap-2"><span className="font-mono text-xs">{t.code}</span><span className="text-rose-600 text-xs">{t.days} ngày</span></li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
