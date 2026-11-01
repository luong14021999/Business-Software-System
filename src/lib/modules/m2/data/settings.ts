// Danh mục cài đặt phòng thí nghiệm (migration 0028).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery } from "@/lib/platform/db";

export type RateKind = "price" | "norm";
export type RateList = { id: string; kind: RateKind; name: string; note: string; active: boolean };
export const rateListStore = createEntityStore<RateList>("rate-lists", [], columnsMapping<RateList>("rate_lists", { kind: "text", name: "text", note: "text", active: "bool" }));

export type RateItem = { id: string; listId: string; sampleTypeId: string; analyte: string; amount: number; cost: number | null };
export const rateItemStore = createEntityStore<RateItem>(
  "rate-items",
  [],
  columnsMapping<RateItem>("rate_items", { listId: "ref", sampleTypeId: "ref", analyte: "text", amount: "number", cost: "optnum" }),
);

/** Thêm vào bảng giá / định mức mọi chỉ tiêu của loại mẫu còn thiếu (giá lấy theo đơn giá tham khảo, định mức = 0). */
export async function fillRateList(listId: string, sampleTypeId: string, kind: RateKind) {
  const rows = await dbQuery(
    `insert into public.rate_items (list_id, sample_type_id, analyte, amount)
     select $1, a.sample_type_id, a.name, case when $3 = 'price' then coalesce(a.unit_price, 0) else 0 end
     from public.lab_analytes a where a.sample_type_id = $2 and a.active
     on conflict (list_id, sample_type_id, analyte) do nothing returning id`,
    [listId, sampleTypeId, kind],
  );
  return rows.length;
}

export type TemplateLine = { name: string; unit?: string; method?: string; subcontractor?: string };
export type BulkTemplate = { id: string; name: string; sampleTypeId: string; description: string; lines: TemplateLine[]; createdBy: string };
export const bulkTemplateStore = createEntityStore<BulkTemplate>(
  "bulk-templates",
  [],
  columnsMapping<BulkTemplate>("bulk_templates", { name: "text", sampleTypeId: "ref", description: "text", lines: "json", createdBy: "text" }),
);

export type BatchTemplate = { id: string; name: string; method: string; analyst: string; instrumentCode: string; chemicals: string; note: string };
export const batchTemplateStore = createEntityStore<BatchTemplate>(
  "batch-templates",
  [],
  columnsMapping<BatchTemplate>("batch_templates", { name: "text", method: "text", analyst: "text", instrumentCode: "text", chemicals: "text", note: "text" }),
);

export type Subcontractor = { id: string; name: string; code: string; phone: string; note: string; active: boolean };
export const subcontractorStore = createEntityStore<Subcontractor>(
  "subcontractors",
  [],
  columnsMapping<Subcontractor>("subcontractors", { name: "text", code: "text", phone: "text", note: "text", active: "bool" }),
);

export type ContainerType = { id: string; name: string; symbol: string; volume: string; note: string };
export const containerTypeStore = createEntityStore<ContainerType>(
  "container-types",
  [],
  columnsMapping<ContainerType>("container_types", { name: "text", symbol: "text", volume: "text", note: "text" }),
);

export type Preservation = { id: string; name: string; description: string };
export const preservationStore = createEntityStore<Preservation>("preservations", [], columnsMapping<Preservation>("preservations", { name: "text", description: "text" }));

/** Lựa chọn cột "Thầu phụ" / phạm vi: VILAS, Nội bộ và các đơn vị thầu phụ đang dùng. */
export async function scopeOptions() {
  const subs = (await subcontractorStore.list()).filter((s) => s.active).map((s) => s.name).sort((a, b) => a.localeCompare(b, "vi"));
  return ["VILAS", "Nội bộ", ...subs.filter((s) => s !== "VILAS" && s !== "Nội bộ"), ...(subs.length ? [] : ["Thầu phụ"])];
}

/**
 * Hàm tra đơn giá (theo tên loại mẫu + tên chỉ tiêu) cho báo giá:
 * ưu tiên bảng giá của đơn hàng, không có thì đơn giá tham khảo trong danh mục chỉ tiêu.
 */
export async function priceResolver(priceListId: string) {
  const { analyteStore, sampleTypeStore } = await import("@/lib/modules/m2/data/orders");
  const { normalizeVi } = await import("@/lib/platform/format");
  const [types, analytes, items] = await Promise.all([sampleTypeStore.list(), analyteStore.list(), priceListId ? rateItemStore.list() : Promise.resolve([] as RateItem[])]);
  const typeId = new Map(types.map((t) => [t.name, t.id]));
  const listed = items.filter((i) => i.listId === priceListId);
  return (matrix: string, criterion: string) => {
    const tid = typeId.get(matrix);
    const n = normalizeVi(criterion);
    const fromList = listed.find((i) => i.sampleTypeId === tid && normalizeVi(i.analyte) === n);
    if (fromList) return fromList.amount;
    return analytes.find((a) => a.sampleTypeId === tid && normalizeVi(a.name) === n)?.unitPrice ?? 0;
  };
}
