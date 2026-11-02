import { Search } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { LabPage, btn, input, table } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import {
  OPPORTUNITY_STATUSES,
  RISK_CATEGORIES,
  RISK_STATUSES,
  RISK_TREATMENTS,
  opportunityStore,
  riskStore,
} from "@/lib/modules/m2/data/quality";
import type { Risk } from "@/lib/mock-data";
import { currentAccess } from "@/lib/platform/data/access";
import { permissionForEntity } from "@/lib/platform/permissions";
import { daysUntil, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đăng ký rủi ro & cơ hội" };

const SCALE = ["1", "2", "3", "4", "5"];

const RISK_FIELDS: CrudField[] = [
  { name: "code", label: "Mã rủi ro", required: true, mono: true, placeholder: "VD: RR-11" },
  { name: "category", label: "Phân loại", type: "select", options: RISK_CATEGORIES },
  { name: "title", label: "Rủi ro", required: true, full: true },
  { name: "cause", label: "Nguyên nhân", type: "textarea" },
  { name: "effect", label: "Hậu quả", type: "textarea" },
  { name: "likelihood", label: "Khả năng xảy ra L (1–5)", type: "select", options: SCALE },
  { name: "impact", label: "Mức nghiêm trọng I (1–5)", type: "select", options: SCALE },
  { name: "controls", label: "Biện pháp kiểm soát hiện có", type: "textarea" },
  { name: "treatment", label: "Hướng xử lý", type: "select", options: RISK_TREATMENTS },
  { name: "owner", label: "Phụ trách" },
  { name: "action", label: "Hành động xử lý", type: "textarea" },
  { name: "residualLikelihood", label: "L tồn dư", type: "select", options: SCALE },
  { name: "residualImpact", label: "I tồn dư", type: "select", options: SCALE },
  { name: "reviewAt", label: "Ngày xem xét lại", type: "date" },
  { name: "status", label: "Trạng thái", type: "select", options: RISK_STATUSES },
  { name: "isoClause", label: "Điều khoản ISO 17025", placeholder: "VD: §4.1" },
];

const OPP_FIELDS: CrudField[] = [
  { name: "title", label: "Cơ hội cải tiến", required: true, full: true },
  { name: "description", label: "Mô tả", type: "textarea" },
  { name: "expectedBenefit", label: "Lợi ích kỳ vọng", full: true },
  { name: "owner", label: "Phụ trách" },
  { name: "status", label: "Trạng thái", type: "select", options: OPPORTUNITY_STATUSES },
];

/** Mức rủi ro theo điểm L × I: nền ô ma trận và màu chữ kiểu Bootstrap. */
function levelOf(score: number) {
  if (score >= 16) return { label: "Rất cao", cell: "bg-[#f2dede]", text: "text-[#a94442]" };
  if (score >= 10) return { label: "Cao", cell: "bg-[#fcdcc4]", text: "text-[#c7581b]" };
  if (score >= 5) return { label: "Trung bình", cell: "bg-[#fcf8e3]", text: "text-[#8a6d3b]" };
  return { label: "Thấp", cell: "bg-[#dff0d8]", text: "text-[#3c763d]" };
}

const STATUS_COLOR: Record<string, string> = {
  "Mở": "text-[#a94442]",
  "Đang xử lý": "text-[#8a6d3b]",
  "Đã giảm thiểu": "text-[#31708f]",
  "Đã đóng": "text-[#3c763d]",
  "Đề xuất": "text-[#777]",
  "Đang triển khai": "text-[#8a6d3b]",
  "Đã đạt": "text-[#3c763d]",
};

const scoreOf = (r: Risk) => r.likelihood * r.impact;
const residualOf = (r: Risk) => r.residualLikelihood * r.residualImpact;
const isOpen = (r: Risk) => r.status === "Mở" || r.status === "Đang xử lý";

const FILTERS = [
  { key: "", label: "Tất cả", test: () => true },
  { key: "high", label: "Cao / Rất cao", test: (r: Risk) => scoreOf(r) >= 10 },
  { key: "open", label: "Mở / Đang xử lý", test: isOpen },
  { key: "closed", label: "Đã giảm thiểu / đóng", test: (r: Risk) => !isOpen(r) },
];

/** Ma trận 5×5: hàng = mức nghiêm trọng I (5 → 1), cột = khả năng xảy ra L (1 → 5); số trong ô là số rủi ro. */
function RiskMatrix({ risks }: { risks: Risk[] }) {
  return (
    <table className="border-collapse text-center text-sm [&_td]:h-12 [&_td]:w-16 [&_td]:border [&_td]:border-[#ddd] [&_th]:px-2 [&_th]:font-bold">
      <thead>
        <tr><th />{[1, 2, 3, 4, 5].map((l) => <th key={l}>L{l}</th>)}</tr>
      </thead>
      <tbody>
        {[5, 4, 3, 2, 1].map((impact) => (
          <tr key={impact}>
            <th>I{impact}</th>
            {[1, 2, 3, 4, 5].map((likelihood) => {
              const score = likelihood * impact;
              const lv = levelOf(score);
              const n = risks.filter((r) => r.likelihood === likelihood && r.impact === impact).length;
              return (
                <td key={likelihood} className={lv.cell} title={`L${likelihood} × I${impact} = ${score} (${lv.label})`}>
                  <div className="text-[10px] text-[#777]">{score}</div>
                  <div className="font-bold">{n || ""}</div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Đăng ký rủi ro & cơ hội (ISO/IEC 17025 §8.5) kiểu XaLab: ma trận 5×5, rủi ro cần xem xét, bảng rủi ro, cơ hội cải tiến. */
export default async function RisksPage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  const { q = "", f = "" } = await searchParams;
  const [risks, opportunities, access] = await Promise.all([riskStore.list(), opportunityStore.list(), currentAccess()]);
  const canWrite = access.can(permissionForEntity("risks"));
  const canWriteOpp = access.can(permissionForEntity("opportunities"));
  risks.sort((a, b) => a.code.localeCompare(b.code, "vi", { numeric: true }));

  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];
  const query = q.trim().toLowerCase();
  const rows = risks.filter((r) => filter.test(r) && (!query || `${r.code} ${r.title} ${r.owner} ${r.category}`.toLowerCase().includes(query)));
  const reviewSoon = risks
    .filter((r) => r.status !== "Đã đóng" && daysUntil(r.reviewAt) <= 30)
    .sort((a, b) => (a.reviewAt || "").localeCompare(b.reviewAt || ""))
    .slice(0, 6);
  const href = (key: string) => `/risks?${new URLSearchParams({ ...(q && { q }), ...(key && { f: key }) })}`;
  const h2 = "mb-2 mt-6 text-xl font-medium text-[#333]";

  return (
    <LabPage
      title="Đăng ký rủi ro & cơ hội"
      rule={false}
      toolbar={
        <>
          <div className="flex">
            {canWrite && <EntityFormDialog mode="add" endpoint="/api/risks" title="Thêm rủi ro" fields={RISK_FIELDS} trigger={<button type="button" className={`${btn} rounded-r-none`}>Thêm +</button>} />}
            <Dropdown
              filter
              className={`${btn} ${canWrite ? "-ml-px rounded-l-none" : ""}`}
              label={`Lọc: ${filter.label}`}
              items={FILTERS.map((x) => ({ label: `${x.label} (${risks.filter(x.test).length})`, href: href(x.key), active: f === x.key }))}
            />
          </div>
          <form action="/risks" className="flex">
            {f && <input type="hidden" name="f" value={f} />}
            <input name="q" defaultValue={q} placeholder="Tìm mã, tiêu đề, phụ trách…" aria-label="Tìm kiếm" className={`${input} !w-56 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
          </form>
        </>
      }
    >
      <p className="mb-3 text-sm text-[#555]">
        Tổng {risks.length} rủi ro · mức Cao / Rất cao <b className="text-[#a94442]">{risks.filter((r) => scoreOf(r) >= 10).length}</b> · đang mở / xử lý {risks.filter(isOpen).length} · đã giảm thiểu / đóng {risks.filter((r) => !isOpen(r)).length}.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className={h2}>Ma trận rủi ro 5×5</h2>
          <RiskMatrix risks={risks} />
          <p className="mt-2 text-xs text-[#777]">Trục dọc: mức nghiêm trọng (I) · trục ngang: khả năng xảy ra (L). Thấp 1–4 · Trung bình 5–9 · Cao 10–15 · Rất cao 16–25.</p>
        </div>
        <div>
          <h2 className={h2}>Cần xem xét trong 30 ngày</h2>
          <table className={table}>
            <thead><tr><th>Mã</th><th>Rủi ro</th><th>Phụ trách</th><th>Xem xét</th></tr></thead>
            <tbody>
              {reviewSoon.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">Không có rủi ro nào đến hạn xem xét</td></tr>}
              {reviewSoon.map((r) => {
                const days = daysUntil(r.reviewAt);
                return (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{r.code}</td>
                    <td><span className={levelOf(scoreOf(r)).text}>●</span> {r.title}</td>
                    <td>{r.owner}</td>
                    <td className={`whitespace-nowrap ${days < 0 ? "font-bold text-[#a94442]" : ""}`}>{fmtDateVN(r.reviewAt)}{days < 0 && <div className="text-xs">quá {-days} ngày</div>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className={h2}>Danh mục rủi ro</h2>
      <CatalogTable
        entity="risks"
        canWrite={canWrite}
        fields={RISK_FIELDS}
        headers={["Mã", "Rủi ro", "Phân loại", "L × I", "Xử lý / phụ trách", "Tồn dư", "Trạng thái"]}
        emptyText={query || f ? "Không có rủi ro phù hợp" : "Chưa có rủi ro nào"}
        rows={rows.map((r) => {
          const lv = levelOf(scoreOf(r));
          const rl = levelOf(residualOf(r));
          return {
            id: r.id,
            label: r.code,
            initial: r,
            cells: [
              <div key="c" className="whitespace-nowrap">
                <b>{r.code}</b>
                {r.isoClause && <div className="text-xs text-[#777]">{r.isoClause}</div>}
              </div>,
              <div key="t" className="max-w-[300px]">
                {r.title}
                {r.action && <div className="text-xs text-[#777]">{r.action}</div>}
              </div>,
              r.category,
              <div key="s" className="whitespace-nowrap">
                {r.likelihood} × {r.impact} = <b>{scoreOf(r)}</b>
                <div className={`text-xs ${lv.text}`}>{lv.label}</div>
              </div>,
              <div key="o">
                {r.treatment}
                <div className="text-xs text-[#777]">{r.owner}</div>
              </div>,
              <div key="r" className="whitespace-nowrap">
                {r.residualLikelihood} × {r.residualImpact} = <b>{residualOf(r)}</b>
                <div className={`text-xs ${rl.text}`}>{rl.label}</div>
              </div>,
              <span key="st" className={STATUS_COLOR[r.status] ?? "text-[#777]"}>{r.status}</span>,
            ],
          };
        })}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className={h2}>Cơ hội cải tiến</h2>
        {canWriteOpp && <EntityFormDialog mode="add" endpoint="/api/opportunities" title="Thêm cơ hội cải tiến" fields={OPP_FIELDS} trigger={<button type="button" className={btn}>Thêm cơ hội +</button>} />}
      </div>
      <CatalogTable
        entity="opportunities"
        canWrite={canWriteOpp}
        fields={OPP_FIELDS}
        headers={["Cơ hội cải tiến", "Lợi ích kỳ vọng", "Phụ trách", "Trạng thái"]}
        emptyText="Chưa có cơ hội cải tiến nào"
        rows={opportunities.map((o) => ({
          id: o.id,
          label: o.title,
          initial: o,
          cells: [
            <div key="t" className="max-w-[360px]">
              {o.title}
              {o.description && <div className="text-xs text-[#777]">{o.description}</div>}
            </div>,
            o.expectedBenefit,
            o.owner,
            <span key="s" className={STATUS_COLOR[o.status] ?? "text-[#777]"}>{o.status}</span>,
          ],
        }))}
      />
    </LabPage>
  );
}
