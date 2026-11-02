import { LabPage, btn, link, table } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import type { QCChart, QCPoint } from "@/lib/mock-data";
import { detectViolations } from "@/lib/modules/m2/westgard";
import { PT_TYPES, ptRoundStore, qcChartStore, qcPointStore } from "@/lib/modules/m2/data/quality";
import { staffStore } from "@/lib/modules/m2/data/staff";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const CHART_FIELDS: CrudField[] = [
  { name: "criterion", label: "Chỉ tiêu", required: true },
  { name: "matrix", label: "Nền mẫu" },
  { name: "method", label: "Phương pháp", full: true },
  { name: "unit", label: "Đơn vị" },
  { name: "referenceMaterial", label: "Mẫu chuẩn / CRM" },
  { name: "mean", label: "Giá trị trung bình x̄", type: "number", required: true },
  { name: "sd", label: "Độ lệch chuẩn SD", type: "number", required: true },
];

const PT_FIELDS: CrudField[] = [
  { name: "type", label: "Loại", type: "select", options: PT_TYPES },
  { name: "criterion", label: "Chỉ tiêu", required: true },
  { name: "provider", label: "Đơn vị tổ chức", required: true },
  { name: "round", label: "Vòng / mã chương trình" },
  { name: "z", label: "Z-score", type: "number", required: true },
  { name: "closedAt", label: "Ngày kết thúc", type: "date" },
];

const VIEW_W = 720;
const VIEW_H = 260;
const PAD = { top: 18, right: 28, bottom: 36, left: 60 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

function LeveyJenningsChart({ chart }: { chart: QCChart }) {
  const enriched = detectViolations(chart.points, chart.mean, chart.sd);
  const yMin = chart.mean - 4 * chart.sd;
  const yMax = chart.mean + 4 * chart.sd;
  const yScale = (v: number) =>
    PAD.top + ((yMax - v) / (yMax - yMin || 1)) * PLOT_H;
  const xScale = (i: number) =>
    PAD.left + (i / Math.max(enriched.length - 1, 1)) * PLOT_W;

  const refLines = [
    { v: chart.mean + 3 * chart.sd, label: "+3s", color: "#dc2626", dash: "5 4" },
    { v: chart.mean + 2 * chart.sd, label: "+2s", color: "#f59e0b", dash: "4 4" },
    { v: chart.mean + chart.sd, label: "+1s", color: "#cbd5e1", dash: "3 4" },
    { v: chart.mean, label: "x̄", color: "#475569", dash: "" },
    { v: chart.mean - chart.sd, label: "−1s", color: "#cbd5e1", dash: "3 4" },
    { v: chart.mean - 2 * chart.sd, label: "−2s", color: "#f59e0b", dash: "4 4" },
    { v: chart.mean - 3 * chart.sd, label: "−3s", color: "#dc2626", dash: "5 4" },
  ];

  const polyline = enriched
    .map((p, i) => `${xScale(i)},${yScale(p.value)}`)
    .join(" ");

  const xTickEvery = enriched.length > 10 ? 3 : 2;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Biểu đồ Levey-Jennings ${chart.criterion}`}
    >
      <rect
        x={PAD.left}
        y={PAD.top}
        width={PLOT_W}
        height={PLOT_H}
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
      />

      {refLines.map((r) => {
        const y = yScale(r.v);
        return (
          <g key={r.label}>
            <line
              x1={PAD.left}
              x2={PAD.left + PLOT_W}
              y1={y}
              y2={y}
              stroke={r.color}
              strokeWidth={r.label === "x̄" ? 1.5 : 1}
              strokeDasharray={r.dash}
              opacity={r.label === "x̄" ? 0.9 : 0.7}
            />
            <text
              x={PAD.left - 6}
              y={y + 3}
              textAnchor="end"
              fontSize="10"
              fill={r.color}
              fontWeight={r.label === "x̄" ? 600 : 500}
            >
              {r.label}
            </text>
            <text
              x={PAD.left - 6}
              y={y + 14}
              textAnchor="end"
              fontSize="9"
              fill="#94a3b8"
            >
              {r.v.toFixed(chart.sd < 0.1 ? 3 : 2)}
            </text>
          </g>
        );
      })}

      <polyline
        points={polyline}
        fill="none"
        stroke="hsl(145 62% 32%)"
        strokeWidth="1.5"
        opacity="0.8"
      />

      {enriched.map((p, i) => {
        const hasCritical = p.flags.includes("1-3s");
        const hasWarning = p.flags.length > 0;
        const fill = hasCritical
          ? "#dc2626"
          : hasWarning
            ? "#f59e0b"
            : "hsl(145 62% 32%)";
        const stroke = hasCritical
          ? "#7f1d1d"
          : hasWarning
            ? "#b45309"
            : "hsl(145 62% 22%)";
        return (
          <g key={i}>
            <circle
              cx={xScale(i)}
              cy={yScale(p.value)}
              r={hasWarning ? 5 : 3.5}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.2}
            />
            {i % xTickEvery === 0 && (
              <text
                x={xScale(i)}
                y={PAD.top + PLOT_H + 14}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
              >
                {p.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}

      <text
        x={PAD.left}
        y={PAD.top + PLOT_H + 30}
        fontSize="9"
        fill="#94a3b8"
      >
        Trục X: ngày đo · Trục Y: giá trị {chart.unit}
      </text>
    </svg>
  );
}

const statsOf = (qcCharts: QCChart[], allFlagged: unknown[], externalQCRounds: unknown[]) => [
  { label: "Chỉ tiêu đang giám sát", value: qcCharts.length },
  { label: "Số lần đo QC tích lũy", value: qcCharts.reduce((sum, c) => sum + c.points.length, 0) },
  { label: "Vi phạm Westgard", value: allFlagged.length },
  { label: "Vòng TNTC / SS liên phòng", value: externalQCRounds.length },
];

/** Màu chữ kết luận PT kiểu Bootstrap. */
const verdictColor: Record<string, string> = { Đạt: "text-[#3c763d]", "Cảnh báo": "text-[#8a6d3b]", "Không đạt": "text-[#a94442]" };

const WESTGARD = [
  { rule: "1-3s", desc: "1 điểm vượt ±3SD", level: "Loại bỏ" },
  { rule: "2-2s", desc: "2 điểm liên tiếp cùng phía > 2SD", level: "Loại bỏ" },
  { rule: "R-4s", desc: "Chênh lệch 2 điểm > 4SD", level: "Cảnh báo" },
  { rule: "4-1s", desc: "4 điểm liên tiếp cùng phía > 1SD", level: "Cảnh báo" },
  { rule: "10x", desc: "10 điểm liên tiếp cùng phía giá trị TB", level: "Cảnh báo" },
];

/** Đảm bảo chất lượng kết quả (QC nội bộ Levey-Jennings / Westgard, PT & so sánh liên phòng) theo kiểu XaLab. */
export default async function QCPage() {
  const [chartRows, pointRows, externalQCRounds, staff] = await Promise.all([
    qcChartStore.list(),
    qcPointStore.list(),
    ptRoundStore.list(),
    staffStore.list(),
  ]);
  const byDate = (a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date);
  const qcCharts: QCChart[] = chartRows
    .sort((a, b) => a.criterion.localeCompare(b.criterion, "vi"))
    .map((c) => ({
      ...c,
      points: pointRows.filter((p) => p.chartId === c.id).sort(byDate) as QCPoint[],
    }));
  externalQCRounds.sort((a, b) => (b.closedAt || "").localeCompare(a.closedAt || ""));
  const allFlagged = qcCharts.flatMap((c) =>
    detectViolations(c.points, c.mean, c.sd)
      .filter((p) => p.flags.length > 0)
      .map((p) => ({ ...p, chart: c })),
  );
  const stats = statsOf(qcCharts, allFlagged, externalQCRounds);
  const chartLabel = (c: { criterion: string; matrix: string; method: string }) =>
    `${c.criterion} trong ${c.matrix}${c.method ? ` · ${c.method}` : ""}`;
  const POINT_FIELDS: CrudField[] = [
    { name: "chartId", label: "Biểu đồ kiểm soát", type: "select", required: true, full: true, options: chartRows.map((c) => ({ value: c.id, label: chartLabel(c) })) },
    { name: "date", label: "Ngày đo", type: "date", required: true, defaultValue: todayISO() },
    { name: "value", label: "Giá trị đo", type: "number", required: true },
    { name: "technician", label: "KTV", type: "select", options: staff.map((s) => s.fullName) },
  ];
  const recentPoints = [...pointRows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  const h3 = "mb-1 mt-8 text-xl text-[#333]";
  const note = "mb-3 text-sm text-[#777]";
  return (
    <LabPage
      title="Đảm bảo chất lượng kết quả phân tích"
      subtitle={<span className="text-lg text-[#333]">Biểu đồ Levey-Jennings, quy tắc Westgard, thử nghiệm thành thạo &amp; so sánh liên phòng</span>}
      toolbar={
        <>
          {chartRows.length > 0 && (
            <EntityFormDialog mode="add" endpoint="/api/qc-points" title="Nhập điểm QC" fields={POINT_FIELDS} trigger={<button type="button" className={btn}>Nhập điểm QC</button>} />
          )}
          <EntityFormDialog mode="add" endpoint="/api/qc-charts" title="Thêm biểu đồ kiểm soát" fields={CHART_FIELDS} trigger={<button type="button" className={btn}>Thêm biểu đồ</button>} />
          <EntityFormDialog mode="add" endpoint="/api/pt-rounds" title="Thêm kết quả PT / so sánh liên phòng" fields={PT_FIELDS} trigger={<button type="button" className={btn}>Thêm vòng PT</button>} />
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <table className={table}>
          <tbody>
            {stats.map((s) => <tr key={s.label}><td>{s.label}</td><td className="text-right font-bold">{s.value}</td></tr>)}
          </tbody>
        </table>
        <div>
          <table className={table}>
            <thead><tr><th>Quy tắc Westgard</th><th>Điều kiện</th><th>Mức</th></tr></thead>
            <tbody>
              {WESTGARD.map((r) => (
                <tr key={r.rule}><td className="font-bold">{r.rule}</td><td>{r.desc}</td><td className={r.level === "Loại bỏ" ? "text-[#a94442]" : "text-[#8a6d3b]"}>{r.level}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-xs text-[#777]">Hệ thống tự phát hiện 5 quy tắc trên dựa trên dữ liệu QC nội bộ – cảnh báo khi mẫu chuẩn vi phạm.</p>
        </div>
      </div>

      <h3 className={h3}>Biểu đồ kiểm soát Levey-Jennings</h3>
      <p className={note}>Mỗi lần phân tích mẫu chuẩn / mẫu QC: nhập 1 điểm – quy tắc Westgard tự đánh giá</p>
      {qcCharts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Chưa có biểu đồ kiểm soát nào</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        {qcCharts.map((c) => {
          const enriched = detectViolations(c.points, c.mean, c.sd);
          const flagged = enriched.filter((p) => p.flags.length > 0);
          const summary = flagged.reduce<Record<string, number>>((acc, p) => {
            p.flags.forEach((f) => {
              acc[f] = (acc[f] || 0) + 1;
            });
            return acc;
          }, {});
          return (
            <div key={c.id} className="rounded border border-[#ddd]">
              <div className="flex items-start justify-between gap-2 border-b border-[#ddd] bg-[#f5f5f5] px-[15px] py-[10px]">
                <div className="min-w-0">
                  <div className="truncate font-bold">{c.criterion} trong {c.matrix}</div>
                  <div className="text-xs text-[#777]">{c.method} · x̄ = {c.mean} {c.unit} · SD = {c.sd} {c.unit}</div>
                </div>
                {flagged.length > 0 ? <span className="shrink-0 text-sm font-bold text-[#8a6d3b]">{flagged.length} vi phạm</span> : <span className="shrink-0 text-sm text-[#3c763d]">Trong kiểm soát</span>}
              </div>
              <div className="p-[15px]">
                <LeveyJenningsChart chart={c} />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#777]">
                  <span>Mẫu chuẩn: <span className="text-[#333]">{c.referenceMaterial}</span></span>
                  <span>·</span>
                  <span>n = {c.points.length}</span>
                  {Object.entries(summary).length > 0 && (
                    <span className="text-[#a94442]">· Quy tắc vi phạm: {Object.entries(summary).map(([rule, count]) => `${rule} × ${count}`).join(", ")}</span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-2 text-sm">
                    <EntityFormDialog
                      mode="add"
                      endpoint="/api/qc-points"
                      title={`Nhập điểm QC – ${c.criterion}`}
                      fields={POINT_FIELDS.map((f) => (f.name === "chartId" ? { ...f, defaultValue: c.id } : f))}
                      trigger={<button type="button" className={link}>Nhập điểm</button>}
                    />
                    <span className="text-[#333]">|</span>
                    <EntityFormDialog mode="edit" endpoint="/api/qc-charts" id={c.id} title={`Sửa biểu đồ – ${c.criterion}`} fields={CHART_FIELDS} initial={c} submitLabel="Lưu thay đổi" trigger={<button type="button" className={link}>Sửa</button>} />
                    <span className="text-[#333]">|</span>
                    <XDeleteLink url={`/api/qc-charts/${c.id}`} label={`biểu đồ ${c.criterion} (kèm ${c.points.length} điểm)`} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className={h3}>Điểm vi phạm Westgard gần đây</h3>
      <p className={note}>Cần điều tra nguyên nhân và ghi nhận hành động khắc phục (nguồn: Kiểm soát chất lượng)</p>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead><tr><th>Ngày đo</th><th>Chỉ tiêu / nền</th><th>Phương pháp</th><th>Giá trị</th><th>Z-score</th><th>Quy tắc</th><th>KTV</th></tr></thead>
          <tbody>
            {allFlagged.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Không có điểm vi phạm</td></tr>}
            {allFlagged
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .slice(0, 8)
              .map((p, i) => (
                <tr key={i}>
                  <td>{fmtDateVN(p.date)}</td>
                  <td>{p.chart.criterion}<div className="text-xs text-[#777]">{p.chart.matrix}</div></td>
                  <td>{p.chart.method}</td>
                  <td>{p.value} {p.chart.unit}</td>
                  <td className={Math.abs(p.z) > 3 ? "font-bold text-[#a94442]" : "text-[#8a6d3b]"}>{p.z > 0 ? "+" : ""}{p.z.toFixed(2)}</td>
                  <td>{p.flags.map((f) => <span key={f} className={`mr-2 ${f === "1-3s" || f === "2-2s" ? "text-[#a94442]" : "text-[#8a6d3b]"}`}>{f}</span>)}</td>
                  <td>{p.technician}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <h3 className={h3}>Kiểm soát chất lượng từ bên ngoài</h3>
      <p className={note}>
        Thử nghiệm thành thạo (PT) &amp; so sánh liên phòng (ILC) – ISO/IEC 17025 §7.7.2 · kết luận tự tính theo ISO 13528: |z| ≤ 2 Đạt, 2 &lt; |z| &lt; 3 Cảnh báo, |z| ≥ 3 Không đạt
      </p>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead><tr><th>Chỉ tiêu</th><th>Loại</th><th>Đơn vị tổ chức</th><th>Vòng</th><th>Kết thúc</th><th className="text-right">Z-score</th><th>Kết luận</th><th /></tr></thead>
          <tbody>
            {externalQCRounds.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Chưa có kết quả PT nào</td></tr>}
            {externalQCRounds.map((r) => (
              <tr key={r.id}>
                <td>{r.criterion}</td>
                <td>{r.type}</td>
                <td>{r.provider}</td>
                <td>{r.round}</td>
                <td>{fmtDateVN(r.closedAt)}</td>
                <td className={`text-right ${Math.abs(r.z) > 2 ? "text-[#8a6d3b]" : ""}`}>{r.z > 0 ? "+" : ""}{r.z.toFixed(1)}</td>
                <td className={verdictColor[r.verdict] ?? ""}>{r.verdict}</td>
                <td className="whitespace-nowrap text-right">
                  <EntityFormDialog mode="edit" endpoint="/api/pt-rounds" id={r.id} title={`Sửa PT – ${r.criterion}`} fields={PT_FIELDS} initial={r} submitLabel="Lưu thay đổi" trigger={<button type="button" className={link}>Sửa</button>} />
                  <span className="mx-2 text-[#333]">|</span>
                  <XDeleteLink url={`/api/pt-rounds/${r.id}`} label={`${r.criterion} – ${r.provider}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className={h3}>Nhật ký điểm QC gần nhất</h3>
      <p className={note}>20 lần đo gần nhất – sửa / xoá khi nhập sai (thay đổi được ghi nhận trên hệ thống)</p>
      <CatalogTable
        entity="qc-points"
        canWrite
        fields={POINT_FIELDS}
        headers={["Ngày", "Biểu đồ", "Giá trị", "KTV"]}
        emptyText="Chưa có điểm QC nào"
        rows={recentPoints.map((p) => {
          const c = chartRows.find((x) => x.id === p.chartId);
          return {
            id: p.id,
            label: `${c?.criterion ?? "điểm"} ${fmtDateVN(p.date)}`,
            initial: p,
            cells: [fmtDateVN(p.date), c ? chartLabel(c) : "—", `${p.value} ${c?.unit ?? ""}`, p.technician],
          };
        })}
      />
    </LabPage>
  );
}
