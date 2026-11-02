import Link from "next/link";
import {
  Sigma,
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  FileSignature,
  Pencil,
  RotateCcw,
  History,
  ArrowRight,
  Lock,
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
import { ResultForm, type ResultFormValues } from "@/components/m2/results/result-form";
import { budgetStore, calcTemplateStore, curveStore } from "@/lib/modules/m2/data/calc-methods";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { StatGrid } from "@/components/common/stat-grid";
import { WorkflowActions } from "@/components/m2/results/workflow-actions";
import type { Conclusion, ResultStatus } from "@/lib/mock-data";
import {
  EDITABLE,
  RESULT_STATUSES,
  listAudit,
  listResults,
  type ResultRow,
} from "@/lib/modules/m2/data/results";
import { samplesStore } from "@/lib/modules/m2/data/samples";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";
import { decisionRuleStore } from "@/lib/modules/m2/data/quality";
import { testLabels, testNoOf } from "@/lib/modules/m2/accreditation";
import { fmtDateVN } from "@/lib/platform/dates";
import { loadReleaseContext } from "@/lib/modules/m2/data/release-rules";
import { currentAccess } from "@/lib/platform/data/access";
import type { CheckResult } from "@/lib/modules/m2/release-checks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nhập kết quả & duyệt" };

const statusVariant: Record<ResultStatus, "secondary" | "default" | "warning" | "success" | "destructive"> = {
  "Đang nhập": "secondary",
  "Chờ QA/QC": "warning",
  "Chờ Trưởng phòng": "default",
  "Đã duyệt": "success",
  "Trả lại sửa": "destructive",
};

const conclusionMeta: Record<Conclusion, { icon: typeof CheckCircle2; color: string; variant: "success" | "destructive" | "warning" | "default" }> = {
  "Đạt": { icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 border-emerald-200", variant: "success" },
  "Không đạt": { icon: XCircle, color: "text-rose-700 bg-rose-50 border-rose-200", variant: "destructive" },
  "Vô định": { icon: AlertTriangle, color: "text-amber-700 bg-amber-50 border-amber-200", variant: "warning" },
  "Báo cáo giá trị": { icon: Sigma, color: "text-blue-700 bg-blue-50 border-blue-200", variant: "default" },
};

const fin = (v: number) => Number.isFinite(v);
const num = (v: number, suffix = "") => (fin(v) ? `${v}${suffix}` : "—");

function ApprovalSteps({ result }: { result: ResultRow }) {
  return (
    <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {result.approvals.map((a, i) => {
        const done = a.decision === "Đạt";
        const rejected = a.decision === "Trả lại sửa";
        const waiting = a.decision === "Chờ";
        return (
          <li
            key={a.step}
            className={`relative p-3 rounded-md border ${
              done ? "border-emerald-200 bg-emerald-50/40" : rejected ? "border-rose-200 bg-rose-50/40" : waiting ? "border-dashed bg-card" : "bg-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs ${
                  done ? "bg-emerald-500 text-white" : rejected ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : rejected ? <RotateCcw className="w-4 h-4" /> : i + 1}
              </div>
              <div className="text-sm font-medium">{a.step}</div>
            </div>
            <div className="mt-1.5 text-xs">
              {waiting ? (
                <span className="text-muted-foreground">Đang chờ</span>
              ) : (
                <>
                  <div className="font-medium">{a.actor}</div>
                  <div className="text-muted-foreground text-[11px]">{a.role}</div>
                  {a.signedAt && <div className="text-[11px] text-muted-foreground mt-0.5">Ký lúc {a.signedAt}</div>}
                  {a.signatureHash && (
                    <div className="text-[10px] font-mono text-emerald-700 mt-0.5" title={a.signatureHash}>
                      Ký điện tử · SHA-256 {a.signatureHash.slice(0, 12)}…
                    </div>
                  )}
                </>
              )}
            </div>
            {a.comment && <div className="mt-2 text-[11px] text-foreground/80 italic line-clamp-3">&ldquo;{a.comment}&rdquo;</div>}
            {i < result.approvals.length - 1 && (
              <ArrowRight className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function DecisionZone({ result }: { result: ResultRow }) {
  const lo = result.acceptanceUpper;
  const hi = result.rejectionUpper;
  const lim = result.decisionLimit;
  const measured = result.mean;
  const u = fin(result.uncertainty) ? result.uncertainty : 0;
  if (!fin(lo) || !fin(hi) || !fin(lim) || !fin(measured) || hi <= lo) {
    return (
      <div className="rounded-md border bg-blue-50/40 border-blue-200 p-3 text-xs text-blue-900/80">
        {result.conclusionExplanation || "Báo cáo giá trị đo"}
        {fin(lim) && ` · Giới hạn ${lim} ${result.unit}`}
      </div>
    );
  }
  const W = 600;
  const H = 90;
  const PAD = { left: 30, right: 30, top: 14, bottom: 30 };
  const PLOT_W = W - PAD.left - PAD.right;
  const PLOT_H = 26;
  const xMin = Math.max(0, Math.min(measured - u, lo) - (hi - lo) * 0.6);
  const xMax = Math.max(measured + u, hi) + (hi - lo) * 0.6;
  const x = (v: number) => PAD.left + ((Math.min(Math.max(v, xMin), xMax) - xMin) / (xMax - xMin)) * PLOT_W;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Vùng quyết định">
      <rect x={PAD.left} y={PAD.top} width={x(lo) - PAD.left} height={PLOT_H} fill="#d1fae5" />
      <rect x={x(lo)} y={PAD.top} width={x(hi) - x(lo)} height={PLOT_H} fill="#fef3c7" />
      <rect x={x(hi)} y={PAD.top} width={PAD.left + PLOT_W - x(hi)} height={PLOT_H} fill="#fee2e2" />
      <line x1={x(lim)} x2={x(lim)} y1={PAD.top - 4} y2={PAD.top + PLOT_H + 4} stroke="#0f172a" strokeWidth="1.5" />
      <text x={x(lim)} y={PAD.top - 6} textAnchor="middle" fontSize="9" fontWeight="600" fill="#0f172a">
        Giới hạn {lim} {result.unit}
      </text>
      <line x1={x(measured - u)} x2={x(measured + u)} y1={PAD.top + PLOT_H + 14} y2={PAD.top + PLOT_H + 14} stroke="#1d8048" strokeWidth="2" />
      <circle cx={x(measured)} cy={PAD.top + PLOT_H + 14} r="3.5" fill="#1d8048" />
      <text x={x(measured)} y={PAD.top + PLOT_H + 27} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1d8048">
        x̄ ± U = {measured} ± {u}
      </text>
      <text x={(PAD.left + x(lo)) / 2} y={PAD.top + PLOT_H / 2 + 3} textAnchor="middle" fontSize="9" fontWeight="600" fill="#047857">ĐẠT</text>
      <text x={(x(lo) + x(hi)) / 2} y={PAD.top + PLOT_H / 2 + 3} textAnchor="middle" fontSize="9" fontWeight="600" fill="#b45309">VÔ ĐỊNH</text>
      <text x={(x(hi) + PAD.left + PLOT_W) / 2} y={PAD.top + PLOT_H / 2 + 3} textAnchor="middle" fontSize="9" fontWeight="600" fill="#b91c1c">KHÔNG ĐẠT</text>
    </svg>
  );
}

const checkMeta: Record<CheckResult["status"], { icon: string; className: string }> = {
  "Đạt": { icon: "✓", className: "text-emerald-700" },
  "Cảnh báo": { icon: "⚠", className: "text-amber-700" },
  "Chặn": { icon: "⊘", className: "text-rose-700 font-medium" },
  "Không áp dụng": { icon: "–", className: "text-muted-foreground" },
};

function ReleaseChecks({ checks, version, stage }: { checks: CheckResult[]; version: number; stage: string }) {
  const blocked = checks.filter((c) => c.status === "Chặn").length;
  const warn = checks.filter((c) => c.status === "Cảnh báo").length;
  return (
    <div className={`p-4 rounded-lg border ${blocked ? "border-rose-300 bg-rose-50/40" : warn ? "border-amber-300 bg-amber-50/30" : "border-emerald-200 bg-emerald-50/30"}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-sm font-semibold">Kiểm soát trước phát hành</div>
        <span className="text-[11px] text-muted-foreground">quy tắc v{version}</span>
      </div>
      <div className="text-xs mb-2">
        {blocked ? `⊘ ${blocked} điều kiện CHẶN – không thể ${stage}` : warn ? `⚠ ${warn} cảnh báo – vẫn ${stage} được, cảnh báo được ghi vào lưu vết` : `✓ Đủ điều kiện ${stage}`}
      </div>
      <ul className="space-y-1.5">
        {checks.map((c) => (
          <li key={c.key} className={`text-[11px] leading-snug flex gap-1.5 ${checkMeta[c.status].className}`} title={c.label}>
            <span className="w-3 shrink-0">{checkMeta[c.status].icon}</span>
            <span>{c.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultDetail({ result }: { result: ResultRow }) {
  const concl = conclusionMeta[result.conclusion] ?? conclusionMeta["Báo cáo giá trị"];
  const recoveryOk = result.matrixSpikeRecovery >= 90 && result.matrixSpikeRecovery <= 110;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 p-3 rounded-lg border bg-card">
          <div className="text-[11px] uppercase font-semibold text-muted-foreground mb-2">Thông tin chỉ tiêu × mẫu</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-xs">
            <div><div className="text-muted-foreground">Mã KQ</div><div className="font-mono font-medium">{result.resultCode}</div></div>
            <div><div className="text-muted-foreground">Mã mẫu</div><div className="font-mono font-medium">{result.sampleCode}</div></div>
            <div><div className="text-muted-foreground">Khách hàng</div><div className="font-medium truncate">{result.customerName || "—"}</div></div>
            <div className="col-span-2"><div className="text-muted-foreground">Chỉ tiêu × nền</div><div className="font-medium">{result.criterion} – {result.matrix}</div></div>
            <div><div className="text-muted-foreground">KTV</div><div className="font-medium">{result.technician}</div></div>
            <div className="col-span-2"><div className="text-muted-foreground">Phương pháp</div><div className="font-medium">{result.method}</div></div>
            <div>
              <div className="text-muted-foreground">Thiết bị</div>
              <div className="font-medium">{result.instrument.code || "—"}</div>
              <div className="text-[10px] text-muted-foreground">{result.instrument.name}</div>
            </div>
            <div className="col-span-2 sm:col-span-3"><div className="text-muted-foreground">Mẫu chuẩn QC</div><div>{result.referenceMaterial || "—"}</div></div>
          </div>
        </div>
        <div className={`p-4 rounded-lg border space-y-2 ${concl.color}`}>
          <div className="flex items-center gap-2">
            <concl.icon className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Kết luận</span>
          </div>
          <div className="text-2xl font-bold">{result.conclusion}</div>
          <div className="text-xs leading-relaxed">{result.conclusionExplanation}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 p-3 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase font-semibold text-muted-foreground">Phép lặp & thống kê</div>
            <Badge variant="outline">n = {result.replicates.length}</Badge>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
            {result.replicates.map((r) => (
              <div key={r.id} className="rounded-md border bg-muted/30 px-2 py-1.5 text-center">
                <div className="text-[10px] text-muted-foreground">Lần {r.id}</div>
                <div className="text-sm font-semibold tabular-nums">{r.value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-md border p-2"><div className="text-muted-foreground">x̄</div><div className="font-semibold text-sm">{num(result.mean)} {result.unit}</div></div>
            <div className="rounded-md border p-2"><div className="text-muted-foreground">SD</div><div className="font-semibold text-sm">{num(result.sd)}</div></div>
            <div className="rounded-md border p-2"><div className="text-muted-foreground">RSD</div><div className="font-semibold text-sm">{num(result.rsd, "%")}</div></div>
            <div className="rounded-md border bg-primary/5 border-primary/30 p-2"><div className="text-muted-foreground">U (k=2)</div><div className="font-semibold text-sm text-primary">{fin(result.uncertainty) ? `±${result.uncertainty}` : "—"}</div></div>
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <div className="text-[11px] uppercase font-semibold text-muted-foreground mb-2">Kiểm soát QA/QC</div>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Độ thu hồi (CRM / spike)</span>
              <span className={`font-semibold ${!fin(result.matrixSpikeRecovery) ? "" : recoveryOk ? "text-emerald-700" : "text-rose-700"}`}>{num(result.matrixSpikeRecovery, "%")}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Mẫu trắng</span>
              <span className="font-semibold">{num(result.blankBlankValue)} {fin(result.blankBlankValue) ? result.unit : ""}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">RSD ≤ 5%</span>
              {fin(result.rsd) ? (
                <Badge variant={result.rsd <= 5 ? "success" : "destructive"} className="text-[10px]">{result.rsd <= 5 ? "Đạt" : "Vượt"}</Badge>
              ) : "—"}
            </li>
          </ul>
          <Link href="/qc" className="mt-3 inline-block text-[11px] text-primary hover:underline">Xem biểu đồ Levey-Jennings →</Link>
        </div>
      </div>

      {(result.calcDetail?.template || result.calcDetail?.curve || result.uncertaintyDetail || result.rawFiles.length > 0) && (
        <div className="p-4 rounded-lg border bg-card space-y-3 text-xs">
          <div className="text-[11px] uppercase font-semibold text-muted-foreground">Dữ liệu gốc & tính toán (§7.5, M2.4)</div>
          {result.calcDetail?.template && (
            <div>
              Công thức <span className="font-mono font-semibold">{result.calcDetail.template.code}</span>:{" "}
              <span className="font-mono">{result.unit} = {result.calcDetail.template.formula}</span>
              <span className="text-muted-foreground"> · {Object.entries(result.calcDetail.template.variables).map(([k, val]) => `${k} = ${val}`).join(" · ")}</span>
            </div>
          )}
          {result.calcDetail?.curve && (
            <div>
              Đường chuẩn <span className="font-mono font-semibold">{result.calcDetail.curve.code}</span>: y = {result.calcDetail.curve.intercept} + {result.calcDetail.curve.slope}·x · R² = {result.calcDetail.curve.r2} · khoảng {result.calcDetail.curve.minConc}–{result.calcDetail.curve.maxConc} {result.calcDetail.curve.concUnit}
            </div>
          )}
          {result.calcDetail && (result.calcDetail.template || result.calcDetail.curve) && (
            <table className="w-full max-w-md">
              <thead className="text-muted-foreground"><tr className="text-left"><th>Lần</th><th>Số đọc</th>{result.calcDetail.concs && <th>Nồng độ</th>}<th>Kết quả</th></tr></thead>
              <tbody className="font-mono">
                {result.calcDetail.readings.map((r, i) => (
                  <tr key={i}><td className="font-sans">{i + 1}</td><td>{r}</td>{result.calcDetail!.concs && <td>{result.calcDetail!.concs[i]}</td>}<td>{result.calcDetail!.values[i]}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {result.uncertaintyDetail && (
            <div>
              <div className="font-medium">Ngân sách độ không đảm bảo đo {result.uncertaintyDetail.budgetCode}</div>
              <table className="w-full max-w-md">
                <tbody>
                  {result.uncertaintyDetail.rows.map((r) => (
                    <tr key={r.name}><td>{r.name} <span className="text-muted-foreground">({r.type}{r.source ? ` · ${r.source}` : ""})</span></td><td className="text-right font-mono">{r.relU}%</td></tr>
                  ))}
                  <tr className="border-t font-medium"><td>u_c tương đối → U (k = {result.uncertaintyDetail.k})</td><td className="text-right font-mono">{result.uncertaintyDetail.relUc}% → ±{result.uncertaintyDetail.U}</td></tr>
                </tbody>
              </table>
              {result.uncertaintyDetail.note && <div className="text-muted-foreground">{result.uncertaintyDetail.note}</div>}
            </div>
          )}
          {result.rawFiles.length > 0 && (
            <div>
              <div className="font-medium">File dữ liệu thô</div>
              <ul>
                {result.rawFiles.map((f, i) => (
                  <li key={i} className="flex flex-wrap gap-x-2">
                    {"id" in f ? (
                      <a href={`/api/raw-files/${(f as { id: string }).id}`} className="text-primary hover:underline">{f.name}</a>
                    ) : (
                      <span>{f.name}</span>
                    )}
                    <span className="text-muted-foreground">{f.size} · {f.uploadedBy}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">SHA-256 {f.hash.slice(0, 16)}…</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="p-4 rounded-lg border bg-card space-y-2">
        <div className="flex items-center gap-2 text-[11px] uppercase font-semibold text-muted-foreground">
          <Scale className="w-3.5 h-3.5" />
          Áp dụng quy tắc quyết định (§7.8.6)
        </div>
        <div className="text-sm font-medium">{result.decisionRuleType || "Không công bố sự phù hợp"}</div>
        <DecisionZone result={result} />
      </div>
    </div>
  );
}

export default async function ResultEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string }>;
}) {
  const { status = "", id = "" } = await searchParams;
  const [results, samples, equipment, chemicals, rules, release, access] = await Promise.all([
    listResults(),
    samplesStore.list(),
    equipmentStore.list(),
    chemicalsStore.list(),
    decisionRuleStore.list(),
    loadReleaseContext(),
    currentAccess(),
  ]);
  const [templates, curves, budgets] = await Promise.all([calcTemplateStore.list(), curveStore.list(), budgetStore.list()]);
  const me = access.actor;

  const queue = results.filter((r) => (status ? r.status === status : r.status !== "Đã duyệt"));
  const selected = results.find((r) => r.id === id) ?? queue[0] ?? results[0];
  const audit = selected ? await listAudit(selected.id) : [];
  // Bước kế tiếp cần kiểm soát; ở bước Trưởng phòng đánh giá thêm ủy quyền phê duyệt của người đang đăng nhập.
  const stage = !selected ? "" : selected.status === "Chờ Trưởng phòng" ? "phê duyệt" : selected.status === "Chờ QA/QC" ? "duyệt QA/QC" : selected.status === "Đã duyệt" ? "phát hành phiếu" : "nộp QA/QC";
  const checks = selected
    ? release.evaluate(selected, selected.status === "Chờ Trưởng phòng" ? me?.name : selected.status === "Đã duyệt" ? selected.approvals.find((a) => a.step === "Trưởng phòng duyệt")?.actor : undefined)
    : [];
  const usable = equipment.filter((e) => !release.lockedEquipment.has(e.code));

  const vnS = (x: number) => (fin(x) ? String(x).replace(".", ",") : "");
  const formProps = {
    samples: samples.map((s) => ({ value: s.code, label: `${s.code} · ${s.customer} · ${s.type}` })),
    tests: testLabels,
    equipment: usable.map((e) => ({ value: e.code, label: `${e.code} · ${e.name}` })),
    crms: chemicals.filter((c) => c.isReference).map((c) => c.name),
    rules: rules.map((r) => ({ value: r.id, label: `${r.criterion} trong ${r.matrix} – ${r.ruleType.split(" (")[0]} (giới hạn ${r.limit} ${r.unit})` })),
    templates: templates.filter((t) => t.status === "Hiệu lực"),
    curves,
    budgets,
    lockedNote: release.lockedEquipment.size ? `${release.lockedEquipment.size} thiết bị đang bị khóa.` : "",
  };
  const editInitial = (r: ResultRow): Partial<ResultFormValues> => ({
    sampleCode: r.sampleCode,
    testLabel: testLabels.find((l) => testNoOf(l) === testNoOf(r.criterion)) ?? "",
    // Sửa trên số đọc gốc (không phải giá trị đã tính).
    replicates: (r.calcDetail?.readings ?? r.replicates.map((x) => x.value)).map((x) => String(x).replace(".", ",")).join("; "),
    unit: r.unit,
    uncertainty: r.budgetId ? "" : vnS(r.uncertainty),
    instrumentCode: r.instrument.code,
    referenceMaterial: r.referenceMaterial,
    matrixSpikeRecovery: vnS(r.matrixSpikeRecovery),
    blankValue: vnS(r.blankBlankValue),
    decisionRuleId: r.decisionRuleId,
    templateId: r.templateId,
    curveId: r.curveId,
    budgetId: r.budgetId,
    varValues: Object.fromEntries(Object.entries(r.calcDetail?.template?.variables ?? {}).map(([k, val]) => [k, String(val).replace(".", ",")])),
  });

  const count = (s: ResultStatus) => results.filter((r) => r.status === s).length;
  const tabs = [{ key: "", label: "Hàng đợi", n: results.filter((r) => r.status !== "Đã duyệt").length }, ...RESULT_STATUSES.map((s) => ({ key: s, label: s, n: count(s) }))];
  const qs = (o: Record<string, string>) => `/result-entry?${new URLSearchParams(Object.fromEntries(Object.entries(o).filter(([, v]) => v)))}`;

  return (
    <>
      <Header
        title="Nhập kết quả & duyệt"
        description="Phiếu diễn biến phân tích · duyệt 3 cấp KTV → QA/QC → Trưởng phòng · lưu vết mọi thay đổi (§7.5, §7.8.1, §7.11)"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Đang nhập", value: count("Đang nhập"), icon: Pencil, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Chờ QA/QC", value: count("Chờ QA/QC"), icon: ShieldCheck, accent: "bg-amber-50 text-amber-600" },
            { label: "Chờ Trưởng phòng", value: count("Chờ Trưởng phòng"), icon: FileSignature, accent: "bg-blue-50 text-blue-600" },
            { label: "Trả lại sửa", value: count("Trả lại sửa"), icon: RotateCcw, accent: "bg-rose-50 text-rose-600" },
          ]}
        />

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div>
              <CardTitle>Kết quả phân tích</CardTitle>
              <CardDescription>Chọn 1 dòng để xem chi tiết, thao tác duyệt và lưu vết</CardDescription>
            </div>
            <ResultForm mode="add" {...formProps} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((t) => (
                <Link
                  key={t.key || "queue"}
                  href={qs({ status: t.key })}
                  className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${
                    status === t.key ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
                  }`}
                >
                  {t.label} <span className="ml-1.5 opacity-70">{t.n}</span>
                </Link>
              ))}
            </div>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Mã KQ</th>
                    <th className="px-3 py-2 font-medium">Mẫu / khách hàng</th>
                    <th className="px-3 py-2 font-medium">Chỉ tiêu</th>
                    <th className="px-3 py-2 font-medium">x̄ ± U</th>
                    <th className="px-3 py-2 font-medium">Kết luận</th>
                    <th className="px-3 py-2 font-medium">KTV</th>
                    <th className="px-3 py-2 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {queue.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Không có kết quả nào</td></tr>
                  )}
                  {queue.map((r) => (
                    <tr key={r.id} className={r.id === selected?.id ? "bg-primary/[0.06]" : "hover:bg-muted/30"}>
                      <td className="px-3 py-2">
                        <Link href={qs({ status, id: r.id })} className="font-mono text-xs font-semibold text-primary hover:underline">{r.resultCode}</Link>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="font-mono">{r.sampleCode}</div>
                        <div className="text-muted-foreground truncate max-w-[200px]">{r.customerName}</div>
                      </td>
                      <td className="px-3 py-2 text-xs max-w-[240px]">
                        <div className="line-clamp-2">{r.criterion}</div>
                        <div className="text-muted-foreground">{r.matrix}</div>
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{num(r.mean)}{fin(r.uncertainty) ? ` ± ${r.uncertainty}` : ""} {r.unit}</td>
                      <td className="px-3 py-2"><Badge variant={conclusionMeta[r.conclusion]?.variant ?? "default"}>{r.conclusion}</Badge></td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{r.technician}</td>
                      <td className="px-3 py-2"><Badge variant={statusVariant[r.status] ?? "secondary"}>{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono">{selected.resultCode}</span>
                  <Badge variant={statusVariant[selected.status] ?? "secondary"}>{selected.status}</Badge>
                </CardTitle>
                <CardDescription>
                  Bắt đầu {fmtDateVN(selected.startedAt)}
                  {selected.finishedAt && ` · phê duyệt ${fmtDateVN(selected.finishedAt)}`}
                </CardDescription>
              </div>
              {EDITABLE.includes(selected.status) ? (
                <div className="flex gap-1.5">
                  <ResultForm mode="edit" id={selected.id} initial={editInitial(selected)} {...formProps} />
                  {selected.status === "Đang nhập" && selected.approvals.every((a) => a.decision === "Chờ") && (
                    <DeleteEntityButton entity="analysis-results" id={selected.id} label={selected.resultCode} />
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="w-3.5 h-3.5" /> Đã khóa – chỉ sửa được khi bị trả lại
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              <ApprovalSteps result={selected} />
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
                <ResultDetail result={selected} />
                <div className="space-y-4">
                  <ReleaseChecks checks={checks} version={release.version} stage={stage} />
                  <WorkflowActions
                    id={selected.id}
                    status={selected.status}
                    email={me?.email ?? ""}
                    can={{ enter: access.can("results.enter"), qa: access.can("results.qa"), approve: access.can("results.approve") }}
                  />
                  {selected.status === "Đã duyệt" && (
                    <Link href="/results" className="block p-4 rounded-lg border bg-emerald-50/50 border-emerald-200 text-sm text-emerald-800 hover:bg-emerald-50">
                      Kết quả đã phê duyệt – in phiếu kết quả từ đơn hàng của mẫu {selected.sampleCode} (trang Kết quả) →
                    </Link>
                  )}
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      <History className="w-4 h-4" /> Lưu vết ({audit.length})
                    </div>
                    <ol className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                      {audit.map((e) => (
                        <li key={e.id} className="text-xs border-l-2 border-primary/30 pl-2.5">
                          <div className="font-medium">{e.action}{e.field && ` · ${e.field}`}</div>
                          {(e.oldValue || e.newValue) && (
                            <div className="font-mono text-[11px]">
                              <span className="text-rose-700 line-through">{e.oldValue || "∅"}</span> → <span className="text-emerald-700">{e.newValue || "∅"}</span>
                            </div>
                          )}
                          {e.detail && <div className="text-muted-foreground">{e.detail}</div>}
                          <div className="text-[11px] text-muted-foreground">{e.actor} · {new Date(e.at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
