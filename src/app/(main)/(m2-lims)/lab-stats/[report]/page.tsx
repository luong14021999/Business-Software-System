import { notFound } from "next/navigation";
import { Download, Search } from "lucide-react";
import { LabPage, btn, input, table } from "@/components/m2/lab-ui/page";
import { LAB_REPORTS, runReport, type LabReport } from "@/lib/modules/m2/data/lab-stats";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const fmt = (v: string | number) => (typeof v === "number" ? v.toLocaleString("vi-VN") : v);

/** Một sổ / bảng thống kê: chọn khoảng ngày, xem trên trang hoặc xuất Excel. */
export default async function LabStatsPage({ params, searchParams }: { params: Promise<{ report: string }>; searchParams: Promise<{ from?: string; to?: string }> }) {
  const { report } = await params;
  if (!(report in LAB_REPORTS)) notFound();
  const key = report as LabReport;
  const sp = await searchParams;
  const today = todayISO();
  const from = sp.from ?? `${today.slice(0, 8)}01`;
  const to = sp.to ?? today;
  const tables = await runReport(key, from, to);
  return (
    <LabPage
      title={LAB_REPORTS[key].title}
      subtitle={LAB_REPORTS[key].hint}
      wide
      toolbar={
        <>
          <form action={`/lab-stats/${key}`} className="flex flex-wrap items-center gap-1.5">
            <label className="text-sm font-bold" htmlFor="from">Từ ngày:</label>
            <input id="from" type="date" name="from" defaultValue={from} className={`${input} !w-40`} />
            <label className="text-sm font-bold" htmlFor="to">đến:</label>
            <input id="to" type="date" name="to" defaultValue={to} className={`${input} !w-40`} />
            <button className={btn}><Search className="h-4 w-4" />Xem</button>
          </form>
          <a href={`/api/lab-stats/${key}?from=${from}&to=${to}`} className={btn}><Download className="h-4 w-4" />Xuất Excel</a>
        </>
      }
    >
      {tables.map((t, i) => (
        <section key={i} className="mb-6">
          {t.title && <h2 className="mb-2 text-xl font-medium">{t.title}</h2>}
          <div className="overflow-x-auto">
            <table className={table}>
              <thead><tr><th>#</th>{t.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {t.rows.length === 0 && <tr><td colSpan={t.columns.length + 1} className="py-6 text-center text-muted-foreground">Không có dữ liệu trong khoảng ngày đã chọn</td></tr>}
                {t.rows.map((r, j) => (
                  <tr key={j}><td>{j + 1}</td>{r.map((v, k) => <td key={k} className={typeof v === "number" ? "whitespace-nowrap text-right" : undefined}>{fmt(v)}</td>)}</tr>
                ))}
                {t.total && t.rows.length > 0 && (
                  <tr className="font-bold"><td />{t.total.map((v, k) => <td key={k} className={typeof v === "number" ? "whitespace-nowrap text-right" : undefined}>{fmt(v)}</td>)}</tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </LabPage>
  );
}
