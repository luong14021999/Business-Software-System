// M3.2 đợt D – dữ liệu: tham chiếu trình tự & lượt BLAST, chỉ thị phân tử, cơ sở sản xuất, phân bố giống, tin thị trường.
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import type { GenotypeRow } from "@/lib/modules/m3/genomics";

// ── M3.2.4 Tham chiếu trình tự (không chứa trình tự) & lượt tìm ────
export type SequenceRef = { id: string; accession: string; molecule: string; gene: string; varietyId: string; germplasmId: string; length: number; checksum: string; note: string };
export const sequenceRefStore = createEntityStore<SequenceRef>(
  "sequence-refs",
  [],
  columnsMapping<SequenceRef>("m3_breed.sequence_refs", {
    accession: "text",
    molecule: "text",
    gene: "text",
    varietyId: "ref",
    germplasmId: "ref",
    length: "number",
    checksum: "text",
    note: "text",
  }),
);

export type BlastHit = { accession: string; identity: number; length: number; mismatches: number; gaps: number; evalue: number; bitscore: number; queryCoverage: number };
export type BlastSearch = { id: string; code: string; program: string; queryLabel: string; queryLength: number; querySha256: string; evalue: number; hits: BlastHit[]; status: string; error: string; actor: string; createdAt: string };

export async function listBlastSearches(limit = 30): Promise<BlastSearch[]> {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select id, code, program, query_label, query_length, query_sha256, evalue, hits, status, error, actor, created_at
     from m3_breed.blast_searches order by created_at desc limit $1`,
    [limit],
  ).catch(() => []);
  return rows.map((r) => ({
    id: r.id as string,
    code: r.code as string,
    program: r.program as string,
    queryLabel: (r.query_label as string) ?? "",
    queryLength: Number(r.query_length ?? 0),
    querySha256: (r.query_sha256 as string) ?? "",
    evalue: Number(r.evalue ?? 0),
    hits: (r.hits as BlastHit[]) ?? [],
    status: r.status as string,
    error: (r.error as string) ?? "",
    actor: (r.actor as string) ?? "",
    createdAt: r.created_at as string,
  }));
}

export async function saveBlastSearch(s: Omit<BlastSearch, "id" | "createdAt">) {
  await dbQuery(
    `insert into m3_breed.blast_searches (code, program, query_label, query_length, query_sha256, evalue, hits, status, error, actor)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)`,
    [s.code, s.program, s.queryLabel, s.queryLength, s.querySha256, s.evalue, JSON.stringify(s.hits), s.status, s.error, s.actor],
  );
}

/** Ghi / cập nhật thông tin mô tả trình tự sau khi dịch vụ BLAST đã nhận trình tự. */
export async function upsertSequenceRef(r: { accession: string; molecule: string; gene: string; varietyId: string; germplasmId: string; length: number; checksum: string; note: string }) {
  await dbQuery(
    `insert into m3_breed.sequence_refs (accession, molecule, gene, variety_id, germplasm_id, length, checksum, note)
     values ($1, $2, $3, nullif($4, '')::uuid, nullif($5, '')::uuid, $6, $7, $8)
     on conflict (accession) do update set molecule = excluded.molecule, gene = excluded.gene, variety_id = excluded.variety_id,
       germplasm_id = excluded.germplasm_id, length = excluded.length, checksum = excluded.checksum, note = excluded.note`,
    [r.accession, r.molecule, r.gene, r.varietyId, r.germplasmId, r.length, r.checksum, r.note],
  );
}

// ── M3.2.5 Chỉ thị phân tử ─────────────────────────────────────────
export type Marker = { id: string; code: string; kind: string; name: string; locus: string; primers: string; alleles: string; note: string };
export const markerStore = createEntityStore<Marker>(
  "markers",
  [],
  columnsMapping<Marker>("m3_breed.markers", { code: "text", kind: "text", name: "text", locus: "text", primers: "text", alleles: "text", note: "text" }),
);

export type GenotypeSample = {
  id: string;
  code: string;
  purpose: string;
  varietyId: string;
  seedLotId: string;
  individualId: string;
  germplasmId: string;
  labSampleCode: string;
  collectedAt: string;
  note: string;
};
export const genotypeSampleStore = createEntityStore<GenotypeSample>(
  "genotype-samples",
  [],
  columnsMapping<GenotypeSample>("m3_breed.genotype_samples", {
    code: "text",
    purpose: "text",
    varietyId: "ref",
    seedLotId: "ref",
    individualId: "ref",
    germplasmId: "ref",
    labSampleCode: "text",
    collectedAt: "date",
    note: "text",
  }),
);

export type GenotypeCall = { id: string; sampleId: string; markerId: string; allele1: string; allele2: string };
export const genotypeCallStore = createEntityStore<GenotypeCall>(
  "genotype-calls",
  [],
  columnsMapping<GenotypeCall>("m3_breed.genotype_calls", { sampleId: "ref", markerId: "ref", allele1: "text", allele2: "text" }),
);

/** Ghi hàng loạt kiểu gen theo mã mẫu / mã chỉ thị; trùng (mẫu, chỉ thị) → cập nhật. Trả số dòng và mã không tìm thấy. */
export async function upsertGenotypes(rows: GenotypeRow[]) {
  const [samples, markers] = await Promise.all([genotypeSampleStore.list(), markerStore.list()]);
  const sampleId = new Map(samples.map((s) => [s.code, s.id]));
  const markerId = new Map(markers.map((m) => [m.code, m.id]));
  const missing = new Set<string>();
  const data = rows.flatMap((r) => {
    const s = sampleId.get(r.sampleCode), m = markerId.get(r.markerCode);
    if (!s) missing.add(`mẫu ${r.sampleCode}`);
    if (!m) missing.add(`chỉ thị ${r.markerCode}`);
    return s && m ? [{ sample_id: s, marker_id: m, allele1: r.allele1, allele2: r.allele2 || null }] : [];
  });
  if (missing.size) return { imported: 0, missing: [...missing] };
  const res = await dbQuery(
    `insert into m3_breed.genotype_calls (sample_id, marker_id, allele1, allele2)
     select x.sample_id, x.marker_id, x.allele1, x.allele2 from json_to_recordset($1::json) as x(sample_id uuid, marker_id uuid, allele1 text, allele2 text)
     on conflict (sample_id, marker_id) do update set allele1 = excluded.allele1, allele2 = excluded.allele2
     returning id`,
    [JSON.stringify(data)],
  );
  return { imported: res.length, missing: [] };
}

// ── M3.2.7 Cơ sở sản xuất, phân bố giống ───────────────────────────
export type Facility = {
  id: string;
  code: string;
  name: string;
  kind: string;
  owner: string;
  address: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  scale: string;
  capacity: string;
  species: string;
  conditions: string;
  inspectedAt: string;
  inspectionResult: string;
  certificate: string;
  status: string;
  note: string;
};
export const facilityStore = createEntityStore<Facility>(
  "breed-facilities",
  [],
  columnsMapping<Facility>("m3_breed.facilities", {
    code: "text",
    name: "text",
    kind: "text",
    owner: "text",
    address: "text",
    district: "text",
    latitude: "optnum",
    longitude: "optnum",
    scale: "text",
    capacity: "text",
    species: "text",
    conditions: "text",
    inspectedAt: "date",
    inspectionResult: "text",
    certificate: "text",
    status: "text",
    note: "text",
  }),
);

export type Distribution = { id: string; varietyId: string; district: string; year: number; areaHa: number; unit: string; source: string };
export const distributionStore = createEntityStore<Distribution>(
  "breed-distributions",
  [],
  columnsMapping<Distribution>("m3_breed.distributions", { varietyId: "ref", district: "text", year: "number", areaHa: "number", unit: "text", source: "text" }),
);

// ── M3.2.8 Tin thị trường, dịch vụ kỹ thuật ────────────────────────
export type MarketPost = {
  id: string;
  code: string;
  kind: string;
  title: string;
  summary: string;
  content: string;
  varietyId: string;
  area: string;
  priceNote: string;
  publishedAt: string;
  isPublic: boolean;
  note: string;
};
export const marketPostStore = createEntityStore<MarketPost>(
  "market-posts",
  [],
  columnsMapping<MarketPost>("m3_breed.market_posts", {
    code: "text",
    kind: "text",
    title: "text",
    summary: "text",
    content: "text",
    varietyId: "ref",
    area: "text",
    priceNote: "text",
    publishedAt: "date",
    isPublic: "bool",
    note: "text",
  }),
);

// ── Cổng công khai (M3.2.8) – chỉ trường được phép công bố ─────────
export async function publicBreedCatalog() {
  if (!isDbConfigured()) return { varieties: [], stock: [], posts: [] };
  const [varieties, stock, posts] = await Promise.all([
    dbQuery(
      `select v.code, v.name, v.kind, v.species, v.public_summary, v.regions, v.recognition_no, v.circulation_type
       from m3_breed.varieties v
       where v.is_public order by v.kind, v.name`,
    ).catch(() => []),
    // Lô giống đạt chuẩn, còn hiệu lực hợp quy, còn hàng: chỉ công bố giống, cấp, lượng còn (không giá, không khách hàng).
    dbQuery(
      `select v.name variety, v.kind, s.level, s.unit, sum(s.quantity - coalesce(d.given, 0)) available
       from m3_breed.seed_lots s
       join m3_breed.varieties v on v.id = s.variety_id and v.is_public
       left join (select seed_lot_id, sum(quantity) given from m3_breed.deliveries group by 1) d on d.seed_lot_id = s.id
       where s.status in ('Đạt', 'Đã chứng nhận') and (s.conformity_until is null or s.conformity_until >= current_date)
       group by v.name, v.kind, s.level, s.unit
       having sum(s.quantity - coalesce(d.given, 0)) > 0
       order by v.name, s.level`,
    ).catch(() => []),
    dbQuery(
      `select p.code, p.kind, p.title, p.summary, p.area, p.price_note, p.published_at, v.name variety
       from m3_breed.market_posts p left join m3_breed.varieties v on v.id = p.variety_id
       where p.is_public order by p.published_at desc nulls last limit 30`,
    ).catch(() => []),
  ]);
  return { varieties, stock, posts } as {
    varieties: Record<string, string | null>[];
    stock: { variety: string; kind: string; level: string; unit: string; available: number }[];
    posts: Record<string, string | null>[];
  };
}

export async function publicMarketPost(code: string) {
  if (!isDbConfigured() || !code || code.length > 64) return null;
  const [r] = await dbQuery(
    `select p.code, p.kind, p.title, p.summary, p.content, p.area, p.price_note, p.published_at, v.name variety
     from m3_breed.market_posts p left join m3_breed.varieties v on v.id = p.variety_id where p.code = $1 and p.is_public`,
    [code],
  ).catch(() => []);
  return (r as Record<string, string | null> | undefined) ?? null;
}

// ── M3.2.7 Chỉ tiêu về giống cho Sở NN&MT, IOC tỉnh ────────────────
/** Số liệu tổng hợp (không có dữ liệu cá nhân, khách hàng, giá) – dùng cho LGSP và API v1. */
export async function breedIndicators(year: number) {
  if (!isDbConfigured()) return null;
  const y = String(year);
  const [[v], byLevel, facilities, byDistrict] = await Promise.all([
    dbQuery(
      `select count(*) filter (where scope = 'Giống của Viện')::int giong_cua_vien,
              count(*) filter (where scope = 'Giống trên địa bàn tỉnh')::int giong_tren_dia_ban,
              count(*) filter (where recognition_no is not null and recognition_no <> '')::int duoc_cong_nhan,
              count(*) filter (where circulation_type is not null and circulation_type <> 'Chưa lưu hành')::int duoc_luu_hanh
       from m3_breed.varieties`,
    ),
    dbQuery(
      `select level cap_giong, unit don_vi, sum(actual_qty)::float san_luong
       from m3_breed.production_lots where status = 'Đã thu hoạch' and to_char(harvested_at, 'YYYY') = $1 group by 1, 2 order by 1`,
      [y],
    ),
    dbQuery(
      `select kind loai, count(*)::int so_co_so, count(*) filter (where inspection_result = 'Đạt')::int dat_kiem_tra
       from m3_breed.facilities where status = 'Đang hoạt động' group by 1`,
    ),
    dbQuery(
      `select d.district huyen, v.name giong, d.area_ha::float dien_tich, d.unit don_vi
       from m3_breed.distributions d join m3_breed.varieties v on v.id = d.variety_id where d.year = $1 order by 1, 2`,
      [year],
    ),
  ]);
  return { donVi: "Viện Nông nghiệp tỉnh Thanh Hóa", nam: year, giong: v, sanXuatTheoCap: byLevel, coSoSanXuat: facilities, phanBoGiong: byDistrict };
}
