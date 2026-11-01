import { Activity, BarChart3, Layers, Sprout } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ConsolePanel } from "@/components/m1/overview/console-panel";
import { ModulePulse, type Pulse } from "@/components/m1/overview/module-pulse";
import { KpiReadout, MiniBars, ShareBars } from "@/components/m1/overview/ops-telemetry";
import { vnd } from "@/components/m1/overview/status";
import { dbQuery } from "@/lib/platform/db";
import { todayISO } from "@/lib/platform/dates";
import { lastMonths } from "@/lib/platform/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bảng điều hành" };

const REV = `status in ('KH chấp nhận', 'Đã ký HĐ', 'Đã nhận mẫu')`;
type Row = Record<string, unknown>;

/** Mọi nguồn số liệu đều có giá trị dự phòng: trang vẫn hiển thị khi CSDL / migration chưa sẵn sàng. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[executive]", (e as Error).message);
    return fallback;
  }
}

/**
 * M1.5 Bảng thông tin điều hành – dành cho Ban lãnh đạo Viện: chỉ số nghiệp vụ của các phần mềm,
 * xu hướng 12 tháng. Tình trạng kỹ thuật (máy chủ, sao lưu, tích hợp) ở Bảng quản trị.
 */
export default async function ExecutivePage() {
  const today = todayISO();
  const year = today.slice(0, 4);
  const months = lastMonths(today, 12);

  const [kpiRows, monthly, byType, pulseRows] = await Promise.all([
      safe<Row[]>(
        () =>
          dbQuery(
            `select
               (select count(*)::int from analytics.fact_samples where to_char(received_at, 'YYYY') = $1) samples_year,
               (select count(*)::int from analytics.fact_samples where first_issued_at is null) samples_open,
               (select percentile_cont(0.5) within group (order by tat_days) from analytics.fact_samples where tat_days is not null) tat_median,
               (select round(100.0 * count(*) filter (where on_time) / nullif(count(*) filter (where on_time is not null), 0)) from analytics.fact_samples) on_time_pct,
               (select coalesce(sum(total), 0) from analytics.fact_revenue where ${REV} and left(month, 4) = $1) revenue_year,
               (select count(*)::int from analytics.fact_nonconformities where status is distinct from 'Đã đóng') nc_open,
               (select count(*)::int from analytics.fact_equipment where status is distinct from 'Ngừng' and days_to_calibration <= 30) eq_due,
               (select count(*)::int from analytics.fact_chemicals where low_stock or days_to_expiry <= 30) chem_alert,
               (select round(100.0 * count(*) filter (where quality in ('Tốt', 'Khá')) / nullif(count(*), 0)) from analytics.fact_feedback) satisfaction,
               (select count(*)::int from analytics.fact_feedback where is_complaint) complaints`,
            [year],
          ),
        [],
      ),
      safe<Row[]>(
        () =>
          dbQuery(
            `select m as month,
               (select count(*)::int from analytics.fact_samples where to_char(received_at, 'YYYY-MM') = m) samples,
               (select coalesce(sum(total), 0) from analytics.fact_revenue where ${REV} and month = m) revenue
             from unnest($1::text[]) m`,
            [months],
          ),
        [],
      ),
      safe<Row[]>(() => dbQuery(`select coalesce(nullif(type, ''), 'Khác') type, count(*)::int n from analytics.fact_samples group by 1 order by 2 desc limit 6`), []),
      // Bảng M3 ở schema riêng (migration 0015) – chưa chạy migration thì chip vẫn hiện, chỉ thiếu số.
      safe<Row[]>(
        () =>
          dbQuery(
            `select
               (select count(*)::int from m3_tissue.culture_batches where status = 'Đang nuôi') batches_growing,
               (select count(*)::int from m3_breed.varieties) varieties,
               (select coalesce(sum(quantity), 0)::int from m3_tissue.lot_sales where to_char(sold_at, 'YYYY') = $1) plants_sold_year,
               (select count(*)::int from m3_breed.seed_lots where status = 'Đã chứng nhận') seed_lots_certified`,
            [year],
          ),
        [],
      ),
  ]);

  const k: Row = kpiRows[0] ?? {};
  const n: Row = pulseRows[0] ?? {};
  const num = (v: unknown) => (v === null || v === undefined || v === "" ? NaN : Number(v));
  const show = (v: unknown, suffix = "") => (Number.isNaN(num(v)) ? "—" : `${num(v)}${suffix}`);

  const pulse: Pulse[] = [
    { code: "M2", name: "Phòng thí nghiệm (LIMS)", value: show(k.samples_open), label: "mẫu chưa trả kết quả", href: "/lims" },
    { code: "M3.1", name: "Nuôi cấy mô & truy xuất nguồn gốc", value: show(n.batches_growing), label: "mẻ cấy đang nuôi", href: "/tissue-overview" },
    { code: "M3.2", name: "Giống cây trồng, vật nuôi, thủy sản", value: show(n.varieties), label: "giống trong lý lịch", href: "/breed-overview" },
  ];

  const sampleSeries = months.map((m) => Number(monthly.find((r) => r.month === m)?.samples ?? 0));
  const revenueSeries = months.map((m) => Number(monthly.find((r) => r.month === m)?.revenue ?? 0));

  return (
    <>
      <Header title="Bảng thông tin điều hành" description="Dành cho Ban lãnh đạo Viện – chỉ số nghiệp vụ của các phần mềm và xu hướng 12 tháng" />
      <main className="relative flex-1 overflow-y-auto scrollbar-thin">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[900px] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]"
          style={{
            backgroundImage: "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative p-3 sm:p-6 space-y-4">
          <ModulePulse items={pulse} />

          <section aria-labelledby="biz-kpi" className="space-y-2">
            <h2 id="biz-kpi" className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <Sprout aria-hidden className="size-4 text-primary" /> Nhân giống
            </h2>
            <KpiReadout
              items={[
                { label: "Mẻ cấy đang nuôi", value: show(n.batches_growing), hint: "M3.1", href: "/tissue-overview" },
                { label: `Cây giống đã xuất ${year}`, value: show(n.plants_sold_year), hint: "cây (M3.1)", href: "/lot-sales" },
                { label: "Giống trong lý lịch", value: show(n.varieties), hint: "M3.2", href: "/varieties" },
                { label: "Lô giống đã chứng nhận", value: show(n.seed_lots_certified), href: "/seed-workbench" },
              ]}
            />
          </section>

          <section aria-labelledby="ops-kpi" className="space-y-2">
            <h2 id="ops-kpi" className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <Activity aria-hidden className="size-4 text-primary" /> Phòng thí nghiệm (M2)
              <span className="font-mono text-[10px] font-normal text-muted-foreground border rounded px-1">kho dữ liệu · analytics</span>
            </h2>
            <KpiReadout
              items={[
                { label: `Mẫu năm ${year}`, value: show(k.samples_year), hint: `${show(k.samples_open)} chưa trả kết quả`, href: "/data-warehouse" },
                { label: `Doanh thu ${year}`, value: Number.isNaN(num(k.revenue_year)) ? "—" : vnd(num(k.revenue_year) / 1e6), hint: "triệu VNĐ, gồm VAT" },
                { label: "TAT trung vị", value: show(k.tat_median), hint: "ngày" },
                { label: "Trả đúng hạn", value: show(k.on_time_pct, "%") },
                { label: "Không phù hợp đang mở", value: show(k.nc_open), alert: num(k.nc_open) > 0 },
                { label: "Thiết bị đến hạn HC", value: show(k.eq_due), hint: "trong 30 ngày", alert: num(k.eq_due) > 0 },
                { label: "Cảnh báo hóa chất", value: show(k.chem_alert), hint: "tồn thấp / sắp hết hạn", alert: num(k.chem_alert) > 0 },
                { label: "Hài lòng khá–tốt", value: show(k.satisfaction, "%"), hint: `${show(k.complaints)} khiếu nại` },
              ]}
            />
          </section>

          <section aria-label="Biểu đồ 12 tháng" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <ConsolePanel title="Mẫu tiếp nhận · 12 tháng" icon={BarChart3} href="/forecast" hrefLabel="Dự báo">
              <MiniBars label="Mẫu tiếp nhận" months={months} values={sampleSeries} />
              <div className="mt-1 text-[11px] text-muted-foreground">Tháng này: <span className="font-mono text-foreground">{sampleSeries[sampleSeries.length - 1]}</span> mẫu</div>
            </ConsolePanel>
            <ConsolePanel title="Doanh thu · 12 tháng" icon={BarChart3}>
              <MiniBars label="Doanh thu" months={months} values={revenueSeries} fmt={(v) => `${vnd(v / 1e6)} triệu VNĐ`} />
              <div className="mt-1 text-[11px] text-muted-foreground">Tháng này: <span className="font-mono text-foreground">{vnd(revenueSeries[revenueSeries.length - 1] / 1e6)}</span> triệu VNĐ (phiếu yêu cầu được chấp nhận)</div>
            </ConsolePanel>
            <ConsolePanel title="Cơ cấu mẫu theo loại" icon={Layers} className="md:col-span-2 xl:col-span-1" href="/data-warehouse" hrefLabel="Kho dữ liệu">
              <ShareBars rows={byType.map((t) => ({ label: String(t.type), n: Number(t.n) }))} />
            </ConsolePanel>
          </section>
        </div>
      </main>
    </>
  );
}
