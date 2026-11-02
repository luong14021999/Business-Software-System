import { Search } from "lucide-react";
import { LabPage, btn, input, link, table } from "@/components/m2/lab-ui/page";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import type { DecisionRule } from "@/lib/mock-data";
import { LIMIT_DIRECTIONS, RULE_TYPES, decisionRuleStore } from "@/lib/modules/m2/data/quality";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "criterion", label: "Chỉ tiêu", required: true, placeholder: "VD: Pb tổng" },
  { name: "matrix", label: "Đối tượng (matrix)", placeholder: "VD: Đất" },
  { name: "method", label: "Phương pháp", full: true, placeholder: "VD: TCVN 6496B:2009" },
  { name: "unit", label: "Đơn vị", placeholder: "mg/kg" },
  { name: "ruleType", label: "Loại quy tắc", type: "select", options: RULE_TYPES },
  { name: "limitDirection", label: "Kiểu giới hạn", type: "select", options: LIMIT_DIRECTIONS.map((d) => ({ value: d, label: d === "max" ? "Giới hạn trên (≤)" : d === "min" ? "Giới hạn dưới (≥)" : "Khoảng (min – max)" })) },
  { name: "limit", label: "Giới hạn (trên / giá trị)", type: "number", required: true },
  { name: "limitMin", label: "Giới hạn dưới (chỉ khi là khoảng)" },
  { name: "uncertainty", label: "U mở rộng (k = 2)", type: "number" },
  { name: "limitSource", label: "Nguồn giới hạn (QCVN, hợp đồng…)", full: true },
  { name: "notes", label: "Ghi chú", type: "textarea" },
  { name: "approvedBy", label: "Người phê duyệt" },
  { name: "approvedAt", label: "Ngày phê duyệt", type: "date", defaultValue: todayISO() },
];

function format(n: number, unit: string) {
  const digits = Math.abs(n) < 1 ? 3 : Math.abs(n) < 10 ? 2 : 1;
  return `${n.toFixed(digits)} ${unit}`;
}

const VIEW_W = 720;
const VIEW_H = 100;
const PAD = { left: 32, right: 32, top: 18, bottom: 32 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = 26;

function ZoneVisualization({ rule }: { rule: DecisionRule }) {
  const limit = rule.limit;
  const u = rule.uncertainty;

  if (rule.limitDirection === "range" && rule.limitMin !== undefined) {
    // 2-sided rule
    const low = rule.limitMin;
    const high = limit;
    const range = high - low;
    const xMin = low - range * 0.4;
    const xMax = high + range * 0.4;
    const xScale = (v: number) =>
      PAD.left + ((v - xMin) / (xMax - xMin)) * PLOT_W;

    const lowAccept = low + u;
    const highAccept = high - u;
    const ticks = [low - u, low, lowAccept, highAccept, high, high + u];

    return (
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Vùng quyết định cho ${rule.criterion}`}
      >
        <rect
          x={PAD.left}
          y={PAD.top}
          width={xScale(low - u) - PAD.left}
          height={PLOT_H}
          fill="#fee2e2"
        />
        <rect
          x={xScale(low - u)}
          y={PAD.top}
          width={xScale(low + u) - xScale(low - u)}
          height={PLOT_H}
          fill="#fef3c7"
        />
        <rect
          x={xScale(low + u)}
          y={PAD.top}
          width={xScale(high - u) - xScale(low + u)}
          height={PLOT_H}
          fill="#d1fae5"
        />
        <rect
          x={xScale(high - u)}
          y={PAD.top}
          width={xScale(high + u) - xScale(high - u)}
          height={PLOT_H}
          fill="#fef3c7"
        />
        <rect
          x={xScale(high + u)}
          y={PAD.top}
          width={PAD.left + PLOT_W - xScale(high + u)}
          height={PLOT_H}
          fill="#fee2e2"
        />

        <line
          x1={xScale(low)}
          x2={xScale(low)}
          y1={PAD.top - 4}
          y2={PAD.top + PLOT_H + 4}
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        <line
          x1={xScale(high)}
          x2={xScale(high)}
          y1={PAD.top - 4}
          y2={PAD.top + PLOT_H + 4}
          stroke="#0f172a"
          strokeWidth="1.5"
        />

        {ticks.map((t, i) => (
          <text
            key={i}
            x={xScale(t)}
            y={PAD.top + PLOT_H + 18}
            textAnchor="middle"
            fontSize="9"
            fill="#475569"
          >
            {t.toFixed(rule.uncertainty < 0.1 ? 3 : 2)}
          </text>
        ))}
        <text
          x={xScale(low)}
          y={PAD.top - 6}
          textAnchor="middle"
          fontSize="9"
          fill="#0f172a"
          fontWeight={600}
        >
          min
        </text>
        <text
          x={xScale(high)}
          y={PAD.top - 6}
          textAnchor="middle"
          fontSize="9"
          fill="#0f172a"
          fontWeight={600}
        >
          max
        </text>
      </svg>
    );
  }

  // 1-sided max rule
  const xMin = -u * 1.5;
  const xMax = limit + 3 * u;
  const xScale = (v: number) =>
    PAD.left + ((v - xMin) / (xMax - xMin)) * PLOT_W;
  const acceptanceEnd = limit - u;
  const rejectionStart = limit + u;
  const ticks = [0, acceptanceEnd, limit, rejectionStart];

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Vùng quyết định cho ${rule.criterion}`}
    >
      <rect
        x={PAD.left}
        y={PAD.top}
        width={xScale(acceptanceEnd) - PAD.left}
        height={PLOT_H}
        fill="#d1fae5"
      />
      <rect
        x={xScale(acceptanceEnd)}
        y={PAD.top}
        width={xScale(rejectionStart) - xScale(acceptanceEnd)}
        height={PLOT_H}
        fill="#fef3c7"
      />
      <rect
        x={xScale(rejectionStart)}
        y={PAD.top}
        width={PAD.left + PLOT_W - xScale(rejectionStart)}
        height={PLOT_H}
        fill="#fee2e2"
      />

      <line
        x1={xScale(limit)}
        x2={xScale(limit)}
        y1={PAD.top - 4}
        y2={PAD.top + PLOT_H + 4}
        stroke="#0f172a"
        strokeWidth="1.5"
      />

      {ticks.map((t, i) => (
        <text
          key={i}
          x={xScale(t)}
          y={PAD.top + PLOT_H + 18}
          textAnchor="middle"
          fontSize="9"
          fill="#475569"
        >
          {t.toFixed(u < 0.1 ? 3 : 2)}
        </text>
      ))}
      <text
        x={xScale(limit)}
        y={PAD.top - 6}
        textAnchor="middle"
        fontSize="9"
        fill="#0f172a"
        fontWeight={600}
      >
        Giới hạn = {limit} {rule.unit}
      </text>

      <text
        x={(PAD.left + xScale(acceptanceEnd)) / 2}
        y={PAD.top + PLOT_H / 2 + 3}
        textAnchor="middle"
        fontSize="9"
        fill="#047857"
        fontWeight={600}
      >
        ĐẠT
      </text>
      <text
        x={(xScale(acceptanceEnd) + xScale(rejectionStart)) / 2}
        y={PAD.top + PLOT_H / 2 + 3}
        textAnchor="middle"
        fontSize="9"
        fill="#b45309"
        fontWeight={600}
      >
        VÔ ĐỊNH
      </text>
      <text
        x={(xScale(rejectionStart) + PAD.left + PLOT_W) / 2}
        y={PAD.top + PLOT_H / 2 + 3}
        textAnchor="middle"
        fontSize="9"
        fill="#b91c1c"
        fontWeight={600}
      >
        KHÔNG ĐẠT
      </text>
    </svg>
  );
}

/** Số quy tắc theo loại (bảng tóm tắt đầu trang). */
const statsOf = (decisionRules: DecisionRule[]) => [
  { label: "Quy tắc đã phê duyệt", value: decisionRules.length },
  { label: "Áp dụng guard band (w = U)", value: decisionRules.filter((r) => r.ruleType.startsWith("Guarded")).length },
  { label: "Simple acceptance", value: decisionRules.filter((r) => r.ruleType.startsWith("Simple")).length },
  { label: "Theo thỏa thuận KH", value: decisionRules.filter((r) => r.ruleType.startsWith("Theo")).length },
];

/** Quy tắc quyết định (ISO/IEC 17025 §7.8.6) theo kiểu XaLab: tóm tắt, cách áp dụng, bảng quy tắc kèm sơ đồ vùng quyết định. */
export default async function DecisionRulesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await decisionRuleStore.list();
  const query = q.trim().toLowerCase();
  const decisionRules = all.filter(
    (r) => !query || `${r.criterion} ${r.matrix} ${r.method} ${r.limitSource}`.toLowerCase().includes(query),
  );
  const stats = statsOf(all);
  return (
    <LabPage
      title="Quy tắc quyết định (Decision rules)"
      subtitle={<span className="text-lg text-[#333]">ISO/IEC 17025:2017 §7.8.6 – kết luận đạt/không đạt có tính đến độ không đảm bảo đo</span>}
      toolbar={
        <>
          <EntityFormDialog
            mode="add"
            endpoint="/api/decision-rules"
            title="Thêm quy tắc quyết định"
            description="Ngưỡng vùng chấp nhận / bác bỏ được tính tự động theo guard band w = U"
            fields={FIELDS}
            trigger={<button type="button" className={btn}>Thêm +</button>}
          />
          <form action="/decision-rules" className="flex">
            <input name="q" defaultValue={q} placeholder="Tìm chỉ tiêu, matrix…" aria-label="Tìm quy tắc" className={`${input} !w-52 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
          </form>
        </>
      }
    >
      <table className={`${table} max-w-xl`}>
        <tbody>
          {stats.map((s) => <tr key={s.label}><td>{s.label}</td><td className="text-right font-bold">{s.value}</td></tr>)}
        </tbody>
      </table>

      <h3 className="mb-1 mt-8 text-xl text-[#333]">Cách áp dụng quy tắc quyết định</h3>
      <p className="mb-3 text-sm text-[#777]">Tham chiếu JCGM 106:2012 – Đánh giá sự phù hợp với giới hạn quy định</p>
      <div className="rounded border border-[#bce8f1] bg-[#d9edf7] p-[15px] text-sm text-[#31708f]">
        <ul className="list-disc space-y-1 pl-5">
          <li><b className="text-[#3c763d]">Vùng ĐẠT:</b> Kết quả + U ≤ giới hạn → kết luận đạt với độ tin cậy 95%</li>
          <li><b className="text-[#8a6d3b]">Vùng VÔ ĐỊNH (guarded):</b> Giới hạn − U &lt; Kết quả &lt; Giới hạn + U → không thể kết luận, cần phân tích lại hoặc thoả thuận với KH</li>
          <li><b className="text-[#a94442]">Vùng KHÔNG ĐẠT:</b> Kết quả − U &gt; giới hạn → kết luận không đạt với độ tin cậy 95%</li>
        </ul>
        <p className="mt-2">
          U là độ không đảm bảo đo mở rộng (Expanded uncertainty, k = 2, tương đương mức tin cậy ~95%). Mặc định Viện áp{" "}
          <b>Guarded acceptance w = U</b> cho chỉ tiêu an toàn thực phẩm; Simple acceptance cho chỉ tiêu định tính.
        </p>
      </div>

      <h3 className="mb-1 mt-8 text-xl text-[#333]">Danh mục quy tắc quyết định</h3>
      <p className="mb-3 text-sm text-[#777]">Phê duyệt theo từng chỉ tiêu × matrix × phương pháp – ghi rõ trên phiếu KQ khi có kết luận đạt/không đạt</p>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr><th>Chỉ tiêu</th><th>Đối tượng</th><th>Phương pháp</th><th>Loại quy tắc</th><th>Giới hạn</th><th>U (k=2)</th><th>Nguồn giới hạn</th><th>Phê duyệt</th><th /></tr>
          </thead>
          <tbody>
            {decisionRules.length === 0 && (
              <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">{query ? "Không có quy tắc phù hợp" : "Chưa có quy tắc quyết định nào"}</td></tr>
            )}
            {decisionRules.map((r) => [
              <tr key={r.id}>
                <td className="font-bold">{r.criterion}</td>
                <td>{r.matrix}</td>
                <td>{r.method}</td>
                <td>{r.ruleType}</td>
                <td className="whitespace-nowrap">
                  {r.limitDirection === "range" && r.limitMin !== undefined
                    ? `${r.limitMin} – ${r.limit} ${r.unit}`
                    : `${r.limitDirection === "min" ? "≥" : "≤"} ${r.limit} ${r.unit}`}
                </td>
                <td className="whitespace-nowrap">±{format(r.uncertainty, r.unit)}</td>
                <td>{r.limitSource}</td>
                <td>{r.approvedBy}<div className="text-xs text-[#777]">{fmtDateVN(r.approvedAt)}</div></td>
                <td className="whitespace-nowrap text-right">
                  <EntityFormDialog
                    mode="edit"
                    endpoint="/api/decision-rules"
                    id={r.id}
                    title={`Sửa quy tắc – ${r.criterion}`}
                    fields={FIELDS}
                    initial={{ ...r, limitMin: r.limitMin ?? "" }}
                    submitLabel="Lưu thay đổi"
                    trigger={<button type="button" className={link}>Sửa</button>}
                  />
                  <span className="mx-2 text-[#333]">|</span>
                  <XDeleteLink url={`/api/decision-rules/${r.id}`} label={`${r.criterion} trong ${r.matrix}`} />
                </td>
              </tr>,
              <tr key={`${r.id}-zone`}>
                <td colSpan={9} className="!border-t-0 !pt-0">
                  <div className="max-w-3xl"><ZoneVisualization rule={r} /></div>
                  {r.notes && <div className="text-xs text-[#777]">{r.notes}</div>}
                </td>
              </tr>,
            ])}
          </tbody>
        </table>
      </div>
    </LabPage>
  );
}
