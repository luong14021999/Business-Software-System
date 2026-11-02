import type { MonthStack } from "@/lib/modules/m2/orders";

/** Màu nhóm theo thứ tự cố định (đã kiểm tra phân biệt được với người mù màu); nhóm "Khác" luôn xám. */
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6"];
const OTHER = "#8a8986";
const colorOf = (series: string[], s: string) => (s === "Khác" ? OTHER : SERIES[series.indexOf(s) % SERIES.length]);

/** Biểu đồ cột chồng theo tháng: mỗi cột một tháng, mỗi đoạn một nhóm; rê chuột xem số từng nhóm, có bảng số liệu bên dưới. */
export function MonthStackChart({ title, data, unit }: { title: string; data: MonthStack; unit: string }) {
  const max = Math.max(1, ...data.months.map((m) => m.total));
  const H = 160;
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 text-base font-medium text-[#333]">{title}</figcaption>
      {data.series.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#555]" aria-label="Chú giải">
          {data.series.map((s) => (
            <li key={s} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: colorOf(data.series, s) }} aria-hidden />
              {s}
            </li>
          ))}
        </ul>
      )}
      <div className="relative" aria-hidden>
        <div className="flex items-end gap-2 border-b border-[#bbb] sm:gap-4" style={{ height: H + 18 }}>
          {data.months.map((m) => (
            <div key={m.key} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-0.5 text-[11px] tabular-nums text-[#555]">{m.total || ""}</span>
              <div className="flex w-full max-w-10 flex-col-reverse gap-[2px]" style={{ height: (m.total / max) * H }}>
                {data.series.map((s) => {
                  const n = m.counts[s];
                  if (!n) return null;
                  return <div key={s} className="w-full last:rounded-t" style={{ flexGrow: n, flexBasis: 0, minHeight: 2, background: colorOf(data.series, s) }} />;
                })}
              </div>
              {m.total > 0 && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden w-max min-w-36 -translate-x-1/2 rounded border border-[#ccc] bg-white p-2 text-xs text-[#333] shadow-md group-hover:block">
                  <div className="mb-1 font-semibold">{m.label}: {m.total} {unit}</div>
                  {data.series.filter((s) => m.counts[s]).map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: colorOf(data.series, s) }} />
                      <span className="flex-1">{s}</span>
                      <span className="tabular-nums">{m.counts[s]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-2 sm:gap-4">
          {data.months.map((m) => <div key={m.key} className="flex-1 text-center text-[11px] text-[#555]">{m.label}</div>)}
        </div>
      </div>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-[#337ab7]">Bảng số liệu</summary>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full border-collapse text-xs [&_td]:border [&_td]:border-[#ddd] [&_td]:px-1.5 [&_td]:py-0.5 [&_th]:border [&_th]:border-[#ddd] [&_th]:px-1.5 [&_th]:py-0.5">
            <thead><tr><th className="text-left">Nhóm</th>{data.months.map((m) => <th key={m.key}>{m.label}</th>)}</tr></thead>
            <tbody>
              {data.series.map((s) => (
                <tr key={s}><td>{s}</td>{data.months.map((m) => <td key={m.key} className="text-right tabular-nums">{m.counts[s]}</td>)}</tr>
              ))}
              <tr className="font-semibold"><td>Tổng</td>{data.months.map((m) => <td key={m.key} className="text-right tabular-nums">{m.total}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </details>
      {data.months.every((m) => !m.total) && <p className="mt-1 text-xs text-muted-foreground">Chưa có số liệu trong 6 tháng gần đây.</p>}
    </figure>
  );
}
