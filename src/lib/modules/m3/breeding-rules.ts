// M3.2 đợt C – quy tắc thuần: cấp giống, đối chiếu bộ chỉ tiêu, phả hệ & hệ số cận huyết, chuỗi lô giống,
// hiệu lực văn bản, cung – cầu. Kiểm thử được.
import { normalizeVi } from "@/lib/platform/format";

export const VARIETY_SCOPES = ["Giống của Viện", "Giống trên địa bàn tỉnh"] as const;
export const CIRCULATION_TYPES = ["Công nhận lưu hành", "Tự công bố lưu hành", "Lưu hành đặc cách", "Chưa lưu hành"] as const;
export const DOC_KINDS = ["Quyết định công nhận", "Quyết định lưu hành", "Bản tự công bố lưu hành", "Văn bằng bảo hộ", "Giấy chứng nhận hợp quy", "Hồ sơ khảo nghiệm", "Khác"] as const;
export const STOCK_KINDS = ["Cây đầu dòng", "Vườn cây đầu dòng", "Đàn giống gốc", "Đàn ông bà", "Đàn bố mẹ", "Đàn hậu bị"] as const;
export const STOCK_STATUSES = ["Đang khai thác", "Tạm dừng", "Loại bỏ"] as const;
export const SEXES = ["—", "Đực", "Cái"] as const;
export const INDIVIDUAL_STATUSES = ["Đang sử dụng", "Loại thải", "Chết", "Xuất bán"] as const;
export const SELECTION_DECISIONS = ["Theo dõi", "Chọn", "Loại"] as const;
export const STANDARD_KINDS = ["Khảo nghiệm VCU", "Khảo nghiệm DUS", "Chất lượng hạt giống", "Chất lượng cây giống", "Giống vật nuôi", "Giống thủy sản"] as const;
export const FIELD_RESULTS = ["Chưa kiểm định", "Đạt", "Không đạt"] as const;
export const SEED_LOT_STATUSES = ["Chờ kiểm định", "Đạt", "Không đạt", "Đã chứng nhận", "Hết hiệu lực"] as const;
export const PRODUCTION_STATUSES = ["Kế hoạch", "Đang sản xuất", "Đã thu hoạch", "Hủy"] as const;
export const LOG_ACTIVITIES = ["Gieo – cấy", "Bón phân", "Phòng trừ dịch hại", "Khử lẫn", "Chăm sóc", "Tiêm phòng", "Thu hoạch", "Khác"] as const;
export const BREED_ORDER_STATUSES = ["Mới", "Đã xác nhận", "Giao một phần", "Hoàn thành", "Hủy"] as const;
export const QTY_UNITS = ["kg", "tấn", "cây", "con", "bầu", "hom"] as const;

/**
 * Cấp giống và thứ bậc (số nhỏ = cấp cao hơn). Cây trồng: tác giả → siêu nguyên chủng → nguyên chủng → xác nhận;
 * vật nuôi, thủy sản: cụ kỵ → ông bà → bố mẹ → thương phẩm. "Khác" không ràng buộc.
 */
export const SEED_LEVELS = [
  { level: "Giống tác giả", rank: 0 },
  { level: "Siêu nguyên chủng", rank: 1 },
  { level: "Nguyên chủng", rank: 2 },
  { level: "Xác nhận 1", rank: 3 },
  { level: "Xác nhận", rank: 3 },
  { level: "Xác nhận 2", rank: 4 },
  { level: "Giống cụ kỵ", rank: 1 },
  { level: "Giống ông bà", rank: 2 },
  { level: "Giống bố mẹ", rank: 3 },
  { level: "Giống thương phẩm", rank: 4 },
  { level: "Khác", rank: -1 },
] as const;
export const SEED_LEVEL_NAMES = SEED_LEVELS.map((l) => l.level);
const rankOf = (level: string) => SEED_LEVELS.find((l) => l.level === level)?.rank ?? -1;

/** Sản xuất theo cấp: lô nguồn phải ở cấp cao hơn cấp sản xuất ra. */
export function validateLevelChain(sourceLevel: string | undefined, producedLevel: string) {
  if (!sourceLevel) return null;
  const s = rankOf(sourceLevel), p = rankOf(producedLevel);
  if (s < 0 || p < 0) return null;
  if (s >= p) return `Không sản xuất giống cấp "${producedLevel}" từ nguồn cấp "${sourceLevel}" – nguồn phải ở cấp cao hơn`;
  return null;
}

// ── Đối chiếu bộ chỉ tiêu ───────────────────────────────────────────

export type Criterion = { criterion: string; unit: string; minValue: number | null; maxValue: number | null };
export type Observation = { criterion: string; value: number | null };
export type CriterionResult = Criterion & { value: number | null; result: "Đạt" | "Không đạt" | "Chưa có số liệu" };

const key = (s: string) => normalizeVi(s);

/** Ngưỡng của chỉ tiêu; null = không giới hạn phía đó. */
export function limitsOf(c: { minValue: number | null; maxValue: number | null }) {
  const n = (v: number | null) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));
  return { min: n(c.minValue), max: n(c.maxValue) };
}

/**
 * Đối chiếu số đo với bộ chỉ tiêu: khớp tên không phân biệt dấu / hoa thường; lấy số đo mới nhất nếu trùng.
 * Kết luận chung "Đạt" khi mọi chỉ tiêu có số liệu và đều đạt.
 */
export function evaluateCriteria(criteria: Criterion[], observations: Observation[]) {
  const byKey = new Map<string, number | null>();
  for (const o of observations) if (o.value != null && Number.isFinite(Number(o.value))) byKey.set(key(o.criterion), Number(o.value));
  const rows: CriterionResult[] = criteria.map((c) => {
    const v = byKey.get(key(c.criterion)) ?? null;
    if (v == null) return { ...c, value: null, result: "Chưa có số liệu" };
    const { min, max } = limitsOf(c);
    const ok = (min == null || v >= min) && (max == null || v <= max);
    return { ...c, value: v, result: ok ? "Đạt" : "Không đạt" };
  });
  const failed = rows.filter((r) => r.result === "Không đạt").length;
  const missing = rows.filter((r) => r.result === "Chưa có số liệu").length;
  const overall: "Đạt" | "Không đạt" | "Chưa đủ số liệu" | "Chưa có bộ chỉ tiêu" =
    rows.length === 0 ? "Chưa có bộ chỉ tiêu" : failed ? "Không đạt" : missing ? "Chưa đủ số liệu" : "Đạt";
  return { rows, failed, missing, overall };
}

// ── Phả hệ & hệ số cận huyết ───────────────────────────────────────

/** Hệ số cận huyết từ mức này trở lên được cảnh báo (6,25% = con của anh chị em họ). */
export const INBREEDING_WARN = 0.0625;

export type PedigreeNode = { id: string; sireId: string; damId: string };

/**
 * Hệ số cận huyết Wright F(X) = hệ số thân thuộc (coancestry) của bố và mẹ.
 * Thuật toán đệ quy: coan(a, b) với a = cá thể "trẻ hơn" (thế hệ sâu hơn) = ½[coan(bố a, b) + coan(mẹ a, b)];
 * coan(a, a) = ½(1 + F(a)). Có ghi nhớ và chặn vòng lặp dữ liệu.
 */
export function inbreeding(nodes: PedigreeNode[]) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depthMemo = new Map<string, number>();
  const depth = (id: string, guard = new Set<string>()): number => {
    if (!id || !byId.has(id) || guard.has(id)) return 0;
    if (depthMemo.has(id)) return depthMemo.get(id)!;
    guard.add(id);
    const n = byId.get(id)!;
    const d = 1 + Math.max(depth(n.sireId, guard), depth(n.damId, guard));
    guard.delete(id);
    depthMemo.set(id, d);
    return d;
  };
  const coanMemo = new Map<string, number>();
  const fMemo = new Map<string, number>();
  const F = (id: string, guard: Set<string>): number => {
    if (fMemo.has(id)) return fMemo.get(id)!;
    const n = byId.get(id);
    const v = n ? coan(n.sireId, n.damId, guard) : 0;
    fMemo.set(id, v);
    return v;
  };
  const coan = (a: string, b: string, guard: Set<string>): number => {
    if (!a || !b || !byId.has(a) || !byId.has(b)) return 0;
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (coanMemo.has(k)) return coanMemo.get(k)!;
    if (guard.has(k)) return 0;
    guard.add(k);
    let v: number;
    if (a === b) v = 0.5 * (1 + F(a, guard));
    else {
      const [young, old] = depth(a) >= depth(b) ? [a, b] : [b, a];
      const y = byId.get(young)!;
      v = 0.5 * (coan(y.sireId, old, guard) + coan(y.damId, old, guard));
    }
    guard.delete(k);
    coanMemo.set(k, v);
    return v;
  };
  return {
    of: (id: string) => Math.round(F(id, new Set()) * 10_000) / 10_000,
    coancestry: (a: string, b: string) => Math.round(coan(a, b, new Set()) * 10_000) / 10_000,
  };
}

/** Cây tổ tiên tới `generations` đời: [{ id, depth, side: "Bố"/"Mẹ" ... }]. */
export function ancestors(id: string, nodes: PedigreeNode[], generations = 3) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: { id: string; depth: number; path: string }[] = [];
  const walk = (cur: string, d: number, path: string) => {
    const n = byId.get(cur);
    if (!n || d > generations) return;
    if (n.sireId) {
      out.push({ id: n.sireId, depth: d, path: `${path}Bố` });
      walk(n.sireId, d + 1, `${path}Bố › `);
    }
    if (n.damId) {
      out.push({ id: n.damId, depth: d, path: `${path}Mẹ` });
      walk(n.damId, d + 1, `${path}Mẹ › `);
    }
  };
  walk(id, 1, "");
  return out;
}

/** Không nhận cá thể làm bố / mẹ của chính nó hoặc tạo vòng; bố phải là Đực, mẹ phải là Cái (nếu đã ghi giới tính). */
export function validateParents(
  x: { id?: string; sireId: string; damId: string },
  nodes: (PedigreeNode & { sex: string; code: string })[],
) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const sire = byId.get(x.sireId), dam = byId.get(x.damId);
  if (x.sireId && x.sireId === x.damId) return "Bố và mẹ không được là cùng một cá thể";
  if (sire && sire.sex === "Cái") return `${sire.code} là cá thể cái – không làm bố`;
  if (dam && dam.sex === "Đực") return `${dam.code} là cá thể đực – không làm mẹ`;
  if (x.id) {
    const isAncestor = (start: string): boolean => {
      const seen = new Set<string>();
      const stack = [start];
      while (stack.length) {
        const cur = stack.pop()!;
        if (cur === x.id) return true;
        if (!cur || seen.has(cur)) continue;
        seen.add(cur);
        const n = byId.get(cur);
        if (n) stack.push(n.sireId, n.damId);
      }
      return false;
    };
    if ((x.sireId && isAncestor(x.sireId)) || (x.damId && isAncestor(x.damId))) return "Bố / mẹ chọn tạo vòng lặp phả hệ";
  }
  return null;
}

// ── Chuỗi lô giống, hiệu lực, cung – cầu ───────────────────────────

/** Chuỗi lô giống ngược về nguồn: lô → lô sản xuất → lô giống nguồn → … → nguồn giống gốc. Chặn vòng lặp. */
export function seedLotChain<
  S extends { id: string; productionLotId: string },
  P extends { id: string; sourceSeedLotId: string; sourceStockId: string },
>(seedLotId: string, seedLots: Map<string, S>, prodLots: Map<string, P>, maxDepth = 20) {
  const chain: { seedLot: S; production: P | undefined }[] = [];
  const seen = new Set<string>();
  let cur = seedLots.get(seedLotId);
  let stockId = "";
  while (cur && !seen.has(cur.id) && chain.length < maxDepth) {
    seen.add(cur.id);
    const p = cur.productionLotId ? prodLots.get(cur.productionLotId) : undefined;
    chain.push({ seedLot: cur, production: p });
    if (p?.sourceStockId) stockId = p.sourceStockId;
    cur = p?.sourceSeedLotId ? seedLots.get(p.sourceSeedLotId) : undefined;
  }
  return { chain, sourceStockId: stockId };
}

/** Văn bản / chứng nhận hết hiệu lực hoặc sắp hết (mặc định 90 ngày). */
export function validityAlert(validUntil: string, today: string, warnDays = 90) {
  if (!validUntil) return null;
  const d = Math.round((Date.parse(validUntil) - Date.parse(today)) / 86_400_000);
  if (d < 0) return { kind: "Hết hiệu lực" as const, days: -d };
  if (d <= warnDays) return { kind: "Sắp hết hiệu lực" as const, days: d };
  return null;
}

/** So cầu (theo địa phương, mùa vụ) với sản lượng kế hoạch / thực tế của cùng giống – mùa vụ. */
export function demandVsSupply(
  demands: { varietyId: string; season: string; quantity: number; unit: string }[],
  lots: { varietyId: string; season: string; plannedQty: number; actualQty: number; unit: string; status: string }[],
) {
  const m = new Map<string, { varietyId: string; season: string; unit: string; demand: number; planned: number; actual: number }>();
  const k = (v: string, s: string, u: string) => `${v}|${normalizeVi(s)}|${u}`;
  for (const d of demands) {
    const kk = k(d.varietyId, d.season, d.unit);
    const cur = m.get(kk) ?? { varietyId: d.varietyId, season: d.season, unit: d.unit, demand: 0, planned: 0, actual: 0 };
    cur.demand += Number(d.quantity) || 0;
    m.set(kk, cur);
  }
  for (const l of lots) {
    if (l.status === "Hủy") continue;
    const kk = k(l.varietyId, l.season, l.unit);
    const cur = m.get(kk) ?? { varietyId: l.varietyId, season: l.season, unit: l.unit, demand: 0, planned: 0, actual: 0 };
    cur.planned += Number(l.plannedQty) || 0;
    cur.actual += Number(l.actualQty) || 0;
    m.set(kk, cur);
  }
  return [...m.values()].map((x) => ({ ...x, gap: Math.max(x.planned, x.actual) - x.demand }));
}

/** Năng suất / đơn vị quy mô và giá thành / đơn vị sản phẩm. */
export function productionMetrics(l: { scale: number; actualQty: number; costTotal: number }, logCost = 0) {
  const scale = Number(l.scale) || 0, qty = Number(l.actualQty) || 0;
  const cost = (Number(l.costTotal) || 0) + logCost;
  return { yieldPerScale: scale > 0 && qty > 0 ? Math.round((qty / scale) * 100) / 100 : null, unitCost: qty > 0 && cost > 0 ? Math.round(cost / qty) : null, cost };
}
