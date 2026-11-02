import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  Network,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { QCChart, QCPoint } from "@/lib/mock-data";
import { detectViolations } from "@/lib/modules/m2/westgard";
import { PT_TYPES, ptRoundStore, qcChartStore, qcPointStore } from "@/lib/modules/m2/data/quality";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
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
  {
    label: "Chỉ tiêu đang giám sát",
    value: qcCharts.length,
    icon: Activity,
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Số lần đo QC tích lũy",
    value: qcCharts.reduce((sum, c) => sum + c.points.length, 0),
    icon: ShieldCheck,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "Vi phạm Westgard",
    value: allFlagged.length,
    icon: AlertTriangle,
    accent: "bg-rose-50 text-rose-600",
  },
  {
    label: "Vòng TNTC / SS liên phòng",
    value: externalQCRounds.length,
    icon: Network,
    accent: "bg-violet-50 text-violet-600",
  },
];

const verdictVariant = {
  Đạt: "success",
  "Cảnh báo": "warning",
  "Không đạt": "destructive",
} as const;

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
  return (
    <>
      <Header
        title="Đảm bảo chất lượng kết quả phân tích"
        description="Biểu đồ Levey-Jennings, quy tắc Westgard, thử nghiệm thành thạo & so sánh liên phòng"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {s.label}
                  </div>
                  <div className="text-3xl font-semibold mt-1.5">{s.value}</div>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.accent}`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Quy tắc Westgard được áp dụng</CardTitle>
            <CardDescription>
              Hệ thống tự phát hiện 5 quy tắc dưới đây dựa trên dữ liệu QC nội
              bộ – cảnh báo khi mẫu chuẩn vi phạm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {[
                {
                  rule: "1-3s",
                  desc: "1 điểm vượt ±3SD",
                  level: "Loại bỏ",
                  color: "text-rose-600 border-rose-200 bg-rose-50",
                },
                {
                  rule: "2-2s",
                  desc: "2 điểm liên tiếp cùng phía > 2SD",
                  level: "Loại bỏ",
                  color: "text-rose-600 border-rose-200 bg-rose-50",
                },
                {
                  rule: "R-4s",
                  desc: "Chênh lệch 2 điểm > 4SD",
                  level: "Cảnh báo",
                  color: "text-amber-700 border-amber-200 bg-amber-50",
                },
                {
                  rule: "4-1s",
                  desc: "4 điểm liên tiếp cùng phía > 1SD",
                  level: "Cảnh báo",
                  color: "text-amber-700 border-amber-200 bg-amber-50",
                },
                {
                  rule: "10x",
                  desc: "10 điểm liên tiếp cùng phía giá trị TB",
                  level: "Cảnh báo",
                  color: "text-amber-700 border-amber-200 bg-amber-50",
                },
              ].map((r) => (
                <div
                  key={r.rule}
                  className={`rounded-lg border p-3 ${r.color}`}
                >
                  <div className="font-mono font-semibold">{r.rule}</div>
                  <div className="mt-1 text-foreground/80">{r.desc}</div>
                  <div className="mt-1 text-[11px] opacity-80">{r.level}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-base font-semibold">Biểu đồ kiểm soát Levey-Jennings</div>
            <div className="text-xs text-muted-foreground">
              Mỗi lần phân tích mẫu chuẩn / mẫu QC: nhập 1 điểm – quy tắc Westgard tự đánh giá
            </div>
          </div>
          <div className="flex gap-2">
            {chartRows.length > 0 && (
              <EntityFormDialog mode="add" endpoint="/api/qc-points" title="Nhập điểm QC" fields={POINT_FIELDS} addLabel="Nhập điểm QC" />
            )}
            <EntityFormDialog mode="add" endpoint="/api/qc-charts" title="Thêm biểu đồ kiểm soát" fields={CHART_FIELDS} addLabel="Thêm biểu đồ" />
          </div>
        </div>
        {qcCharts.length === 0 && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">Chưa có biểu đồ kiểm soát nào</CardContent></Card>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {qcCharts.map((c) => {
            const enriched = detectViolations(c.points, c.mean, c.sd);
            const flagged = enriched.filter((p) => p.flags.length > 0);
            const summary = flagged.reduce<Record<string, number>>(
              (acc, p) => {
                p.flags.forEach((f) => {
                  acc[f] = (acc[f] || 0) + 1;
                });
                return acc;
              },
              {},
            );
            return (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        {c.criterion} trong {c.matrix}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {c.method} · x̄ = {c.mean} {c.unit} · SD = {c.sd}{" "}
                        {c.unit}
                      </CardDescription>
                    </div>
                    {flagged.length > 0 ? (
                      <Badge variant="warning">
                        <AlertTriangle className="w-3 h-3" />
                        {flagged.length} vi phạm
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3" />
                        Trong kiểm soát
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <LeveyJenningsChart chart={c} />
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Mẫu chuẩn:{" "}
                      <span className="text-foreground">
                        {c.referenceMaterial}
                      </span>
                    </span>
                    <span>·</span>
                    <span>n = {c.points.length}</span>
                    <span className="ml-auto flex gap-1.5">
                      <EntityFormDialog
                        mode="add"
                        endpoint="/api/qc-points"
                        title={`Nhập điểm QC – ${c.criterion}`}
                        fields={POINT_FIELDS.map((f) => (f.name === "chartId" ? { ...f, defaultValue: c.id } : f))}
                        addLabel="Điểm"
                      />
                      <EntityFormDialog mode="edit" endpoint="/api/qc-charts" id={c.id} title={`Sửa biểu đồ – ${c.criterion}`} fields={CHART_FIELDS} initial={c} submitLabel="Lưu thay đổi" />
                      <DeleteEntityButton entity="qc-charts" id={c.id} label={`biểu đồ ${c.criterion} (kèm ${c.points.length} điểm)`} />
                    </span>
                    {Object.entries(summary).length > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-foreground font-medium">
                          Quy tắc vi phạm:
                        </span>
                        {Object.entries(summary).map(([rule, count]) => (
                          <Badge key={rule} variant="destructive">
                            {rule} × {count}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Điểm vi phạm Westgard gần đây</CardTitle>
            <CardDescription>
              Cần điều tra nguyên nhân và ghi nhận hành động khắc phục (nguồn: Kiểm soát chất lượng)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Ngày đo</TableHead>
                    <TableHead>Chỉ tiêu / nền</TableHead>
                    <TableHead>Phương pháp</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Z-score</TableHead>
                    <TableHead>Quy tắc</TableHead>
                    <TableHead>KTV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allFlagged.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                        Không có điểm vi phạm
                      </TableCell>
                    </TableRow>
                  )}
                  {allFlagged
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .slice(0, 8)
                    .map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground text-xs">
                          {fmtDateVN(p.date)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {p.chart.criterion}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {p.chart.matrix}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.chart.method}
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.value} {p.chart.unit}
                        </TableCell>
                        <TableCell
                          className={`font-mono text-xs ${
                            Math.abs(p.z) > 3
                              ? "text-destructive font-semibold"
                              : "text-warning"
                          }`}
                        >
                          {p.z > 0 ? "+" : ""}
                          {p.z.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {p.flags.map((f) => (
                              <Badge
                                key={f}
                                variant={
                                  f === "1-3s" || f === "2-2s"
                                    ? "destructive"
                                    : "warning"
                                }
                              >
                                {f}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.technician}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div>
              <CardTitle>Kiểm soát chất lượng từ bên ngoài</CardTitle>
              <CardDescription>
                Thử nghiệm thành thạo (PT) & so sánh liên phòng (ILC) – ISO/IEC 17025 §7.7.2 · kết luận tự tính
                theo ISO 13528: |z| ≤ 2 Đạt, 2 &lt; |z| &lt; 3 Cảnh báo, |z| ≥ 3 Không đạt
              </CardDescription>
            </div>
            <EntityFormDialog mode="add" endpoint="/api/pt-rounds" title="Thêm kết quả PT / so sánh liên phòng" fields={PT_FIELDS} addLabel="Thêm vòng PT" />
          </CardHeader>
          <CardContent>
            {externalQCRounds.length === 0 && <div className="text-sm text-muted-foreground">Chưa có kết quả PT nào</div>}
            <ul className="space-y-3">
              {externalQCRounds.map((r) => {
                const Icon =
                  r.verdict === "Đạt"
                    ? CheckCircle2
                    : r.verdict === "Không đạt"
                      ? XCircle
                      : AlertTriangle;
                return (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 p-3 rounded-md border bg-card"
                  >
                    <div
                      className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                        r.verdict === "Đạt"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.verdict === "Không đạt"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {r.criterion}
                        </span>
                        <Badge variant="outline">{r.type}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {r.provider} · Vòng {r.round} · Kết thúc {fmtDateVN(r.closedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        Z-score
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          Math.abs(r.z) > 2
                            ? "text-warning"
                            : "text-foreground"
                        }`}
                      >
                        {r.z > 0 ? "+" : ""}
                        {r.z.toFixed(1)}
                      </div>
                      <Badge variant={verdictVariant[r.verdict] ?? "secondary"}>
                        {r.verdict}
                      </Badge>
                      <div className="flex gap-1.5 mt-2 justify-end">
                        <EntityFormDialog mode="edit" endpoint="/api/pt-rounds" id={r.id} title={`Sửa PT – ${r.criterion}`} fields={PT_FIELDS} initial={r} submitLabel="Lưu thay đổi" />
                        <DeleteEntityButton entity="pt-rounds" id={r.id} label={`${r.criterion} – ${r.provider}`} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
        <CrudTableCard
          title="Nhật ký điểm QC gần nhất"
          description="20 lần đo gần nhất – sửa / xoá khi nhập sai (thay đổi được ghi nhận trên hệ thống)"
          endpoint="/api/qc-points"
          entity="qc-points"
          editFields={POINT_FIELDS}
          addNode={null}
          headers={["Ngày", "Biểu đồ", "Giá trị", "KTV"]}
          emptyText="Chưa có điểm QC nào"
          rows={recentPoints.map((p) => {
            const c = chartRows.find((x) => x.id === p.chartId);
            return {
              id: p.id,
              label: `${c?.criterion ?? "điểm"} ${fmtDateVN(p.date)}`,
              initial: p,
              cells: [
                <span key="d" className="text-xs">{fmtDateVN(p.date)}</span>,
                <span key="c" className="text-sm">{c ? chartLabel(c) : "—"}</span>,
                <span key="v" className="font-medium">{p.value} {c?.unit}</span>,
                <span key="t" className="text-xs">{p.technician}</span>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
