import Link from "next/link";
import { Download, Sprout, Banknote, Clock, Star } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatGrid } from "@/components/common/stat-grid";
import { Bars } from "@/components/common/bar-chart";
import { tissueReport } from "@/lib/modules/m3/data/tissue-report";
import { fmtPct, pct } from "@/lib/modules/m3/rates";
import { fmtVND, marginPct } from "@/lib/platform/format";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Báo cáo cây giống" };

const short = (n: number) => (n >= 1e9 ? `${(n / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ` : n >= 1e6 ? `${Math.round(n / 1e6)}tr` : n.toLocaleString("vi-VN"));

export default async function TissueReportsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const thisYear = Number(todayISO().slice(0, 4));
  const year = Math.min(thisYear + 1, Math.max(2020, Number((await searchParams).year) || thisYear));
  const r = await tissueReport(year);
  const margin = marginPct(r.totals.revenueWithCost, r.totals.cost);

  return (
    <>
      <Header title="Báo cáo sản xuất – kinh doanh cây giống" description="Sản lượng ra ngôi, xuất bán, doanh thu, giá thành và lãi theo lô, giao hàng đúng hạn, phản hồi khách hàng" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          {[thisYear - 2, thisYear - 1, thisYear].map((y) => (
            <Link key={y} href={`/tissue-reports?year=${y}`} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${y === year ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>Năm {y}</Link>
          ))}
          <a href={`/api/m3-reports/tissue?year=${year}`} className="ml-auto h-8 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent"><Download className="w-4 h-4" /> Xuất CSV</a>
        </div>
        <StatGrid
          stats={[
            { label: `Cây ra ngôi ${year}`, value: r.totals.plants.toLocaleString("vi-VN"), icon: Sprout, accent: "bg-emerald-50 text-emerald-700", hint: `sống ${fmtPct(pct(r.totals.survived, r.totals.plants))}` },
            { label: `Doanh thu ${year}`, value: fmtVND(r.totals.revenue), icon: Banknote, accent: "bg-blue-50 text-blue-600", hint: `${r.totals.sold.toLocaleString("vi-VN")} cây · lãi ${margin == null ? "—" : `${margin.toLocaleString("vi-VN")}%`}` },
            { label: "Giao đúng hạn", value: r.totals.dueOrders ? `${r.totals.onTime}/${r.totals.dueOrders}` : "—", icon: Clock, accent: "bg-violet-50 text-violet-600", hint: "đơn có ngày giao trong năm" },
            { label: "Hài lòng", value: r.totals.avgRating == null ? "—" : `${r.totals.avgRating.toFixed(1)} / 5`, icon: Star, accent: "bg-amber-50 text-amber-600", hint: `${r.totals.feedback} phản hồi` },
          ]}
        />
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardHeader><CardTitle>Cây ra ngôi theo tháng</CardTitle></CardHeader><CardContent><Bars months={r.months} values={r.plantsByMonth} fmt={short} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Doanh thu theo tháng</CardTitle></CardHeader><CardContent><Bars months={r.months} values={r.revenueByMonth} fmt={short} /></CardContent></Card>
        </section>
        <Card>
          <CardHeader><CardTitle>Theo giống</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr><th className="text-left font-medium py-1">Giống</th><th className="text-right font-medium">Ra ngôi</th><th className="text-right font-medium">Tỷ lệ sống</th><th className="text-right font-medium">Đã bán</th><th className="text-right font-medium">Doanh thu</th></tr></thead>
              <tbody className="divide-y">
                {r.bySpecies.map((s) => (
                  <tr key={s.species}><td className="py-1.5">{s.species}</td><td className="text-right">{s.plants.toLocaleString("vi-VN")}</td><td className="text-right">{fmtPct(s.survival)}</td><td className="text-right">{s.sold.toLocaleString("vi-VN")}</td><td className="text-right whitespace-nowrap">{fmtVND(s.revenue)}</td></tr>
                ))}
                {r.bySpecies.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground text-xs">Chưa có dữ liệu</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Giá thành và lãi theo lô</CardTitle><CardDescription>Lô ra ngôi hoặc có xuất bán trong năm; giá thành / cây theo định mức và đơn giá cấu hình</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr><th className="text-left font-medium py-1">Lô</th><th className="text-left font-medium">Giống</th><th className="text-right font-medium">Sống / ra ngôi</th><th className="text-right font-medium">Đã bán</th><th className="text-right font-medium">Doanh thu</th><th className="text-right font-medium">Giá thành / cây</th><th className="text-right font-medium">Lãi</th></tr></thead>
              <tbody className="divide-y">
                {r.byLot.map((l) => (
                  <tr key={l.code}>
                    <td className="py-1.5 font-mono text-xs">{l.code}</td>
                    <td className="text-xs">{l.species}</td>
                    <td className="text-right text-xs">{l.survived}/{l.quantity}</td>
                    <td className="text-right text-xs">{l.sold}</td>
                    <td className="text-right text-xs whitespace-nowrap">{fmtVND(l.revenue)}</td>
                    <td className="text-right text-xs whitespace-nowrap">{l.perPlant != null ? fmtVND(l.perPlant) : "—"}</td>
                    <td className={`text-right text-xs ${l.margin != null && l.margin < 0 ? "text-rose-600" : ""}`}>{l.margin == null ? "—" : `${l.margin.toLocaleString("vi-VN")}%`}</td>
                  </tr>
                ))}
                {r.byLot.length === 0 && <tr><td colSpan={7} className="py-4 text-center text-muted-foreground text-xs">Chưa có dữ liệu</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
