// M3.1.6 Truy xuất nguồn gốc lô cây giống bằng QR: lô → các mẻ cấy chuyển → vật liệu khởi đầu → cây mẹ.
// Chỉ các trường được phép công bố (không có khách hàng, người cấy, tủ cấy, ghi chú nội bộ, giá).
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

export type PublicLotTrace = {
  lotCode: string;
  status: string;
  grade: string;
  acclimatizedAt: string;
  readyAt: string;
  quantity: number;
  survived: number;
  species: string;
  variety: string;
  explantType: string;
  collectedAt: string;
  materialCode: string;
  mother: { code: string; origin: string; diseaseStatus: string; diseaseTestedAt: string; diseaseMethod: string; pathogens: string } | null;
  /** Các mẻ cấy từ mẻ đầu tiên đến mẻ ra ngôi. */
  batches: { code: string; stage: string; subcultureNo: number; startedAt: string; recipeCode: string; recipeName: string; baseMedium: string }[];
};

export async function publicLotTrace(code: string): Promise<PublicLotTrace | null> {
  if (!isDbConfigured() || !code || code.length > 64) return null;
  const [lot] = await dbQuery(
    `select id, code, status, grade, acclimatized_at, ready_at, quantity, survived, batch_id
     from m3_tissue.seedling_lots where code = $1 and status <> 'Hủy'`,
    [code.trim()],
  ).catch(() => []);
  if (!lot) return null;
  // Đi ngược chuỗi mẻ cha (giới hạn 50 đời, chặn vòng lặp).
  const chain = lot.batch_id
    ? await dbQuery(
        `with recursive up as (
           select b.*, 1 depth, array[b.id] path from m3_tissue.culture_batches b where b.id = $1
           union all
           select p.*, up.depth + 1, up.path || p.id from m3_tissue.culture_batches p
           join up on p.id = up.parent_batch_id
           where up.depth < 50 and not p.id = any(up.path)
         )
         select up.code, up.stage, up.subculture_no, up.started_at, up.material_id, up.depth,
                r.code recipe_code, r.name recipe_name, r.base_medium
         from up left join m3_tissue.media_recipes r on r.id = up.recipe_id
         order by up.depth desc`,
        [lot.batch_id],
      ).catch(() => [])
    : [];
  const rootMaterialId = chain[0]?.material_id as string | undefined;
  const [m] = rootMaterialId
    ? await dbQuery(
        `select m.code, m.species, m.variety, m.explant_type, m.collected_at,
                mp.code mp_code, mp.origin mp_origin, mp.disease_status, mp.disease_tested_at, mp.disease_method, mp.pathogens
         from m3_tissue.materials m left join m3_tissue.mother_plants mp on mp.id = m.mother_plant_id
         where m.id = $1`,
        [rootMaterialId],
      ).catch(() => [])
    : [];
  const s = (v: unknown) => (v == null ? "" : String(v));
  return {
    lotCode: s(lot.code),
    status: s(lot.status),
    grade: s(lot.grade),
    acclimatizedAt: s(lot.acclimatized_at),
    readyAt: s(lot.ready_at),
    quantity: Number(lot.quantity) || 0,
    survived: Number(lot.survived) || 0,
    species: s(m?.species),
    variety: s(m?.variety),
    explantType: s(m?.explant_type),
    collectedAt: s(m?.collected_at),
    materialCode: s(m?.code),
    mother: m?.mp_code
      ? { code: s(m.mp_code), origin: s(m.mp_origin), diseaseStatus: s(m.disease_status), diseaseTestedAt: s(m.disease_tested_at), diseaseMethod: s(m.disease_method), pathogens: s(m.pathogens) }
      : null,
    batches: chain.map((b) => ({
      code: s(b.code),
      stage: s(b.stage),
      subcultureNo: Number(b.subculture_no) || 0,
      startedAt: s(b.started_at),
      recipeCode: s(b.recipe_code),
      recipeName: s(b.recipe_name),
      baseMedium: s(b.base_medium),
    })),
  };
}
