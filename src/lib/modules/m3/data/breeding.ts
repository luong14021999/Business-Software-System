// M3.2 – giống cây trồng, vật nuôi, thủy sản (schema m3_breed).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

export const BREED_KINDS = ["Cây trồng", "Vật nuôi", "Thủy sản"] as const;

// ── Lý lịch giống ───────────────────────────────────────────────────
export const VARIETY_STATUSES = ["Đang khảo nghiệm", "Được công nhận", "Lưu hành", "Ngừng sản xuất"] as const;

export type Variety = {
  id: string;
  code: string;
  name: string;
  kind: (typeof BREED_KINDS)[number];
  species: string;
  origin: string;
  owner: string;
  recognitionNo: string;
  recognizedAt: string;
  traits: string;
  status: (typeof VARIETY_STATUSES)[number];
  scope: string;
  circulationType: string;
  circulationNo: string;
  circulationAt: string;
  regions: string;
  areaHa: number;
  isPublic: boolean;
  publicSummary: string;
  note: string;
};

export const varietyStore = createEntityStore<Variety>(
  "varieties",
  [],
  columnsMapping<Variety>("m3_breed.varieties", {
    code: "text",
    name: "text",
    kind: "text",
    species: "text",
    origin: "text",
    owner: "text",
    recognitionNo: "text",
    recognizedAt: "date",
    traits: "text",
    status: "text",
    scope: "text",
    circulationType: "text",
    circulationNo: "text",
    circulationAt: "date",
    regions: "text",
    areaHa: "number",
    isPublic: "bool",
    publicSummary: "text",
    note: "text",
  }),
);

// ── Nguồn gen ───────────────────────────────────────────────────────
export const CONSERVATION_METHODS = ["Đồng ruộng", "Kho lạnh", "In vitro", "Đông lạnh", "Trang trại"] as const;
export const GERMPLASM_STATUSES = ["Đang lưu giữ", "Cần phục tráng", "Đã mất"] as const;

export type Germplasm = {
  id: string;
  code: string;
  kind: (typeof BREED_KINDS)[number];
  species: string;
  localName: string;
  collectedAt: string;
  collectionSite: string;
  conservation: string;
  quantity: string;
  evaluation: string;
  status: (typeof GERMPLASM_STATUSES)[number];
  note: string;
};

export const germplasmStore = createEntityStore<Germplasm>(
  "germplasm",
  [],
  columnsMapping<Germplasm>("m3_breed.germplasm", {
    code: "text",
    kind: "text",
    species: "text",
    localName: "text",
    collectedAt: "date",
    collectionSite: "text",
    conservation: "text",
    quantity: "text",
    evaluation: "text",
    status: "text",
    note: "text",
  }),
);

// ── Khảo nghiệm ────────────────────────────────────────────────────
export const TRIAL_KINDS = ["Khảo nghiệm VCU", "Khảo nghiệm DUS", "Sản xuất thử", "So sánh giống"] as const;
export const TRIAL_RESULTS = ["Đang theo dõi", "Đạt", "Không đạt"] as const;

export type BreedTrial = {
  id: string;
  code: string;
  varietyId: string;
  kind: (typeof TRIAL_KINDS)[number];
  site: string;
  season: string;
  startAt: string;
  endAt: string;
  yield: string;
  result: (typeof TRIAL_RESULTS)[number];
  leader: string;
  standardId: string;
  note: string;
};

export const breedTrialStore = createEntityStore<BreedTrial>(
  "breed-trials",
  [],
  columnsMapping<BreedTrial>("m3_breed.trials", {
    code: "text",
    varietyId: "ref",
    kind: "text",
    site: "text",
    season: "text",
    startAt: "date",
    endAt: "date",
    yield: "text",
    result: "text",
    leader: "text",
    standardId: "ref",
    note: "text",
  }),
);

// ── M3.2.1 Văn bản pháp lý giống ───────────────────────────────────
export type VarietyDocument = { id: string; varietyId: string; kind: string; number: string; issuedAt: string; issuer: string; validUntil: string; url: string; note: string };
export const varietyDocumentStore = createEntityStore<VarietyDocument>(
  "variety-documents",
  [],
  columnsMapping<VarietyDocument>("m3_breed.variety_documents", {
    varietyId: "ref",
    kind: "text",
    number: "text",
    issuedAt: "date",
    issuer: "text",
    validUntil: "date",
    url: "text",
    note: "text",
  }),
);

// ── M3.2.2 Nguồn giống gốc, cá thể, chọn lọc ───────────────────────
export type SourceStock = {
  id: string;
  code: string;
  varietyId: string;
  kind: string;
  name: string;
  location: string;
  quantity: number;
  recognitionNo: string;
  recognizedAt: string;
  validUntil: string;
  status: string;
  note: string;
};
export const sourceStockStore = createEntityStore<SourceStock>(
  "source-stocks",
  [],
  columnsMapping<SourceStock>("m3_breed.source_stocks", {
    code: "text",
    varietyId: "ref",
    kind: "text",
    name: "text",
    location: "text",
    quantity: "number",
    recognitionNo: "text",
    recognizedAt: "date",
    validUntil: "date",
    status: "text",
    note: "text",
  }),
);

export type Individual = { id: string; code: string; stockId: string; varietyId: string; sex: string; bornAt: string; sireId: string; damId: string; generation: string; status: string; note: string };
export const individualStore = createEntityStore<Individual>(
  "individuals",
  [],
  columnsMapping<Individual>("m3_breed.individuals", {
    code: "text",
    stockId: "ref",
    varietyId: "ref",
    sex: "text",
    bornAt: "date",
    sireId: "ref",
    damId: "ref",
    generation: "text",
    status: "text",
    note: "text",
  }),
);

export type SelectionRecord = { id: string; individualId: string; stockId: string; measuredAt: string; criterion: string; value: number | null; unit: string; decision: string; note: string };
export const selectionRecordStore = createEntityStore<SelectionRecord>(
  "selection-records",
  [],
  columnsMapping<SelectionRecord>("m3_breed.selection_records", {
    individualId: "ref",
    stockId: "ref",
    measuredAt: "date",
    criterion: "text",
    value: "optnum",
    unit: "text",
    decision: "text",
    note: "text",
  }),
);

// ── M3.2.3 Bộ chỉ tiêu, số đo khảo nghiệm ──────────────────────────
export type BreedStandard = { id: string; code: string; name: string; kind: string; species: string; level: string; validFrom: string; note: string };
export const breedStandardStore = createEntityStore<BreedStandard>(
  "breed-standards",
  [],
  columnsMapping<BreedStandard>("m3_breed.standards", {
    code: "text",
    name: "text",
    kind: "text",
    species: "text",
    level: "text",
    validFrom: "date",
    note: "text",
  }),
);

export type StandardCriterion = { id: string; standardId: string; criterion: string; unit: string; minValue: number | null; maxValue: number | null; method: string; sortOrder: number };
export const standardCriterionStore = createEntityStore<StandardCriterion>(
  "standard-criteria",
  [],
  columnsMapping<StandardCriterion>("m3_breed.standard_criteria", {
    standardId: "ref",
    criterion: "text",
    unit: "text",
    minValue: "optnum",
    maxValue: "optnum",
    method: "text",
    sortOrder: "number",
  }),
);

export type TrialObservation = { id: string; trialId: string; criterion: string; value: number | null; unit: string; note: string };
export const trialObservationStore = createEntityStore<TrialObservation>(
  "trial-observations",
  [],
  columnsMapping<TrialObservation>("m3_breed.trial_observations", { trialId: "ref", criterion: "text", value: "optnum", unit: "text", note: "text" }),
);

// ── M3.2.6 Sản xuất theo cấp, lô giống ─────────────────────────────
export type ProductionLot = {
  id: string;
  code: string;
  varietyId: string;
  level: string;
  sourceSeedLotId: string;
  sourceStockId: string;
  facility: string;
  season: string;
  scale: number;
  scaleUnit: string;
  plannedQty: number;
  actualQty: number;
  unit: string;
  survivalPct: number | null;
  startedAt: string;
  harvestedAt: string;
  costTotal: number;
  status: string;
  facilityId: string;
  note: string;
};
export const productionLotStore = createEntityStore<ProductionLot>(
  "breed-production-lots",
  [],
  columnsMapping<ProductionLot>("m3_breed.production_lots", {
    code: "text",
    varietyId: "ref",
    level: "text",
    sourceSeedLotId: "ref",
    sourceStockId: "ref",
    facility: "text",
    season: "text",
    scale: "number",
    scaleUnit: "text",
    plannedQty: "number",
    actualQty: "number",
    unit: "text",
    survivalPct: "optnum",
    startedAt: "date",
    harvestedAt: "date",
    costTotal: "number",
    status: "text",
    facilityId: "ref",
    note: "text",
  }),
);

export type ProductionLog = { id: string; lotId: string; loggedAt: string; activity: string; detail: string; cost: number; actor: string };
export const productionLogStore = createEntityStore<ProductionLog>(
  "breed-production-logs",
  [],
  columnsMapping<ProductionLog>("m3_breed.production_logs", { lotId: "ref", loggedAt: "date", activity: "text", detail: "text", cost: "number", actor: "text" }),
);

export type SeedLot = {
  id: string;
  code: string;
  varietyId: string;
  level: string;
  productionLotId: string;
  quantity: number;
  unit: string;
  producedAt: string;
  standardId: string;
  sampleCode: string;
  fieldInspectedAt: string;
  fieldResult: string;
  certificateNo: string;
  certifiedAt: string;
  conformityNo: string;
  conformityUntil: string;
  status: string;
  note: string;
};
export const seedLotStore = createEntityStore<SeedLot>(
  "seed-lots",
  [],
  columnsMapping<SeedLot>("m3_breed.seed_lots", {
    code: "text",
    varietyId: "ref",
    level: "text",
    productionLotId: "ref",
    quantity: "number",
    unit: "text",
    producedAt: "date",
    standardId: "ref",
    sampleCode: "text",
    fieldInspectedAt: "date",
    fieldResult: "text",
    certificateNo: "text",
    certifiedAt: "date",
    conformityNo: "text",
    conformityUntil: "date",
    status: "text",
    note: "text",
  }),
);

// ── M3.2.6 Nhu cầu, đơn hàng, giao nhận ────────────────────────────
export type BreedDemand = { id: string; area: string; season: string; varietyId: string; species: string; quantity: number; unit: string; source: string; note: string };
export const breedDemandStore = createEntityStore<BreedDemand>(
  "breed-demands",
  [],
  columnsMapping<BreedDemand>("m3_breed.demands", {
    area: "text",
    season: "text",
    varietyId: "ref",
    species: "text",
    quantity: "number",
    unit: "text",
    source: "text",
    note: "text",
  }),
);

export type BreedOrder = { id: string; code: string; customerId: string; varietyId: string; level: string; quantity: number; unit: string; dueAt: string; season: string; unitPrice: number; status: string; note: string };
export const breedOrderStore = createEntityStore<BreedOrder>(
  "breed-orders",
  [],
  columnsMapping<BreedOrder>("m3_breed.orders", {
    code: "text",
    customerId: "ref",
    varietyId: "ref",
    level: "text",
    quantity: "number",
    unit: "text",
    dueAt: "date",
    season: "text",
    unitPrice: "number",
    status: "text",
    note: "text",
  }),
);

export type Delivery = { id: string; code: string; orderId: string; seedLotId: string; deliveredAt: string; quantity: number; receiver: string; note: string };
export const deliveryStore = createEntityStore<Delivery>(
  "breed-deliveries",
  [],
  columnsMapping<Delivery>("m3_breed.deliveries", {
    code: "text",
    orderId: "ref",
    seedLotId: "ref",
    deliveredAt: "date",
    quantity: "number",
    receiver: "text",
    note: "text",
  }),
);

// ── Truy xuất công khai lô giống (QR) ──────────────────────────────
export type PublicSeedTrace = {
  code: string;
  variety: string;
  species: string;
  kind: string;
  level: string;
  producedAt: string;
  status: string;
  certificateNo: string;
  certifiedAt: string;
  conformityNo: string;
  conformityUntil: string;
  recognitionNo: string;
  circulation: string;
  chain: { code: string; level: string; season: string; facility: string; harvestedAt: string }[];
  source: { kind: string; name: string; recognitionNo: string } | null;
};

/** Chỉ thông tin được phép công bố: giống, cấp, chứng nhận, chuỗi cấp giống – không có khách hàng, giá, nhật ký nội bộ. */
export async function publicSeedTrace(code: string): Promise<PublicSeedTrace | null> {
  if (!isDbConfigured() || !code || code.length > 64) return null;
  const [l] = await dbQuery(
    `select s.code, s.level, s.produced_at, s.status, s.certificate_no, s.certified_at, s.conformity_no, s.conformity_until, s.production_lot_id,
            v.name variety, v.species, v.kind, v.recognition_no, v.circulation_type, v.circulation_no
     from m3_breed.seed_lots s left join m3_breed.varieties v on v.id = s.variety_id
     where s.code = $1 and s.status <> 'Không đạt'`,
    [code.trim()],
  ).catch(() => []);
  if (!l) return null;
  const chain: PublicSeedTrace["chain"] = [];
  let source: PublicSeedTrace["source"] = null;
  let prodId = l.production_lot_id as string | null;
  const seen = new Set<string>();
  while (prodId && !seen.has(prodId) && chain.length < 20) {
    seen.add(prodId);
    const [p] = await dbQuery(
      `select p.code, p.level, p.season, p.facility, p.harvested_at, p.source_seed_lot_id, p.source_stock_id,
              st.kind stock_kind, st.name stock_name, st.recognition_no stock_rec
       from m3_breed.production_lots p left join m3_breed.source_stocks st on st.id = p.source_stock_id where p.id = $1`,
      [prodId],
    ).catch(() => []);
    if (!p) break;
    chain.push({ code: String(p.code), level: String(p.level ?? ""), season: String(p.season ?? ""), facility: String(p.facility ?? ""), harvestedAt: String(p.harvested_at ?? "") });
    if (p.stock_name) source = { kind: String(p.stock_kind ?? ""), name: String(p.stock_name), recognitionNo: String(p.stock_rec ?? "") };
    if (!p.source_seed_lot_id) break;
    const [up] = await dbQuery(`select production_lot_id from m3_breed.seed_lots where id = $1`, [p.source_seed_lot_id]).catch(() => []);
    prodId = (up?.production_lot_id as string) ?? null;
  }
  const s = (v: unknown) => (v == null ? "" : String(v));
  return {
    code: s(l.code),
    variety: s(l.variety),
    species: s(l.species),
    kind: s(l.kind),
    level: s(l.level),
    producedAt: s(l.produced_at),
    status: s(l.status),
    certificateNo: s(l.certificate_no),
    certifiedAt: s(l.certified_at),
    conformityNo: s(l.conformity_no),
    conformityUntil: s(l.conformity_until),
    recognitionNo: s(l.recognition_no),
    circulation: [s(l.circulation_type), s(l.circulation_no)].filter(Boolean).join(" "),
    chain,
    source,
  };
}
