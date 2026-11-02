// Danh mục cài đặt phòng thí nghiệm (migration 0028).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery } from "@/lib/platform/db";
import { emptyRow, type SpecRow } from "@/lib/modules/m2/spec-rows";

export type RateKind = "price" | "norm";
export type RateList = { id: string; kind: RateKind; name: string; note: string; active: boolean; costPrice: boolean };
export const rateListStore = createEntityStore<RateList>("rate-lists", [], columnsMapping<RateList>("rate_lists", { kind: "text", name: "text", note: "text", active: "bool", costPrice: "bool" }));

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
export type BulkTemplate = { id: string; name: string; sampleTypeId: string; description: string; lines: TemplateLine[]; createdBy: string; active: boolean };
export const bulkTemplateStore = createEntityStore<BulkTemplate>(
  "bulk-templates",
  [],
  columnsMapping<BulkTemplate>("bulk_templates", { name: "text", sampleTypeId: "ref", description: "text", lines: "json", createdBy: "text", active: "bool" }),
);

export type BatchTemplate = { id: string; name: string; method: string; analyst: string; instrumentCode: string; chemicals: string; note: string; active: boolean };
export const batchTemplateStore = createEntityStore<BatchTemplate>(
  "batch-templates",
  [],
  columnsMapping<BatchTemplate>("batch_templates", { name: "text", method: "text", analyst: "text", instrumentCode: "text", chemicals: "text", note: "text", active: "bool" }),
);

export type Subcontractor = {
  id: string;
  name: string;
  code: string;
  phone: string;
  note: string;
  active: boolean;
  taxCode: string;
  fax: string;
  email: string;
  address: string;
  invoiceAddress: string;
  contact: string;
  asInternal: boolean;
};
export const subcontractorStore = createEntityStore<Subcontractor>(
  "subcontractors",
  [],
  columnsMapping<Subcontractor>("subcontractors", { name: "text", code: "text", phone: "text", note: "text", active: "bool", taxCode: "text", fax: "text", email: "text", address: "text", invoiceAddress: "text", contact: "text", asInternal: "bool" }),
);

export type ContainerType = { id: string; name: string; symbol: string; volume: string; note: string; description: string };
export const containerTypeStore = createEntityStore<ContainerType>(
  "container-types",
  [],
  columnsMapping<ContainerType>("container_types", { name: "text", symbol: "text", volume: "text", note: "text", description: "text" }),
);

export type Preservation = { id: string; name: string; description: string; sampleTypeId: string; isField: boolean };
export const preservationStore = createEntityStore<Preservation>(
  "preservations",
  [],
  columnsMapping<Preservation>("preservations", { name: "text", description: "text", sampleTypeId: "ref", isField: "bool" }),
);

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

// ── Danh mục chi tiết (migration 0029) ──────────────────────────────

export type LabMethod = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  analyst: string;
  attachmentUrl: string;
  recordTemplate1: string;
  recordTemplate2: string;
  isokinetic: boolean;
  quickMeasure: boolean;
  subcontractorMethod: boolean;
};
export const labMethodStore = createEntityStore<LabMethod>(
  "lab-methods",
  [],
  columnsMapping<LabMethod>("lab_methods", {
    name: "text",
    description: "text",
    active: "bool",
    analyst: "text",
    attachmentUrl: "text",
    recordTemplate1: "text",
    recordTemplate2: "text",
    isokinetic: "bool",
    quickMeasure: "bool",
    subcontractorMethod: "bool",
  }),
);

export type AnalyteGroup = { id: string; name: string; sort: number; isMtld: boolean; description: string; resultTemplate: string; testField: string; owner: string };
export const analyteGroupStore = createEntityStore<AnalyteGroup>(
  "analyte-groups",
  [],
  columnsMapping<AnalyteGroup>("analyte_groups", { name: "text", sort: "number", isMtld: "bool", description: "text", resultTemplate: "text", testField: "text", owner: "text" }),
);

export type NamedItem = { id: string; name: string; note: string };
export type InstrumentType = NamedItem & {
  description: string;
  unit: string;
  depreciationYears: string;
  shiftsPerYear: number | null;
  manualUrl: string;
  isField: boolean;
  departmentId: string;
};
export const instrumentTypeStore = createEntityStore<InstrumentType>(
  "instrument-types",
  [],
  columnsMapping<InstrumentType>("instrument_types", {
    name: "text",
    note: "text",
    description: "text",
    unit: "text",
    depreciationYears: "text",
    shiftsPerYear: "optnum",
    manualUrl: "text",
    isField: "bool",
    departmentId: "ref",
  }),
);
export type Manufacturer = NamedItem & { country: string };
export const manufacturerStore = createEntityStore<Manufacturer>("manufacturers", [], columnsMapping<Manufacturer>("manufacturers", { name: "text", country: "text", note: "text" }));

export type AnalyteMethod = { id: string; analyteId: string; method: string; isDefault: boolean; minValue: number | null; maxValue: number | null; subcontractor: string };
export const analyteMethodStore = createEntityStore<AnalyteMethod>(
  "analyte-methods",
  [],
  columnsMapping<AnalyteMethod>("analyte_methods", { analyteId: "ref", method: "text", isDefault: "bool", minValue: "optnum", maxValue: "optnum", subcontractor: "text" }),
);

export type ResourceKind = "instrument" | "instrument_lab" | "container" | "preservation" | "analyst" | "chemical";
export type AnalyteResource = { id: string; analyteId: string; kind: ResourceKind; name: string; isDefault: boolean };
export const analyteResourceStore = createEntityStore<AnalyteResource>(
  "analyte-resources",
  [],
  columnsMapping<AnalyteResource>("analyte_resources", { analyteId: "ref", kind: "text", name: "text", isDefault: "bool" }),
);

/** Chỉ một phương pháp mặc định cho mỗi chỉ tiêu: bỏ cờ mặc định ở các phương pháp khác. */
export async function setDefaultMethod(analyteId: string, methodId: string) {
  await dbQuery(`update public.analyte_methods set is_default = (id = $2) where analyte_id = $1`, [analyteId, methodId]);
  await dbQuery(`update public.lab_analytes a set method = m.method from public.analyte_methods m where m.id = $2 and a.id = $1`, [analyteId, methodId]);
}

/** Chỉ tiêu phụ (migration 0039): bóc tách chỉ tiêu chính (theo loại mẫu, phương pháp) thì tự thêm các chỉ tiêu phụ. */
export type AnalyteMapping = { id: string; sampleTypeId: string; mainAnalyteId: string; method: string; accessoryIds: string[]; hideAccessory: boolean };
export const analyteMappingStore = createEntityStore<AnalyteMapping>(
  "analyte-mappings",
  [],
  columnsMapping<AnalyteMapping>("analyte_mappings", { sampleTypeId: "ref", mainAnalyteId: "ref", method: "text", accessoryIds: "json", hideAccessory: "bool" }),
);

/** Kiểm tra khai báo chỉ tiêu phụ: có chỉ tiêu chính, ít nhất một chỉ tiêu phụ, không lấy chính nó làm chỉ tiêu phụ. */
export const checkMapping = (b: Partial<AnalyteMapping>) =>
  b.mainAnalyteId === "" || ("mainAnalyteId" in b && !b.mainAnalyteId)
    ? "Chọn chỉ tiêu chính"
    : b.accessoryIds && !b.accessoryIds.length
      ? "Chọn ít nhất một chỉ tiêu phụ"
      : b.mainAnalyteId && b.accessoryIds?.includes(b.mainAnalyteId)
        ? "Chỉ tiêu phụ không được trùng chỉ tiêu chính"
        : null;

/** Ghi cả lưới chỉ tiêu của một cột quy chuẩn: dòng có giới hạn thì thêm / sửa, dòng trống thì xóa. Trả số dòng đã ghi. */
export async function saveSpecRows(specId: string, rows: SpecRow[]) {
  let n = 0;
  for (const r of rows) {
    if (!r.analyte.trim()) continue;
    if (emptyRow(r)) {
      await dbQuery(`delete from public.specification_limits where spec_id = $1 and analyte = $2`, [specId, r.analyte.trim()]);
      continue;
    }
    await dbQuery(
      `insert into public.specification_limits (spec_id, analyte, min_value, max_value, not_detected, nd_text, print_note, print_text)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (spec_id, analyte) do update set min_value = excluded.min_value, max_value = excluded.max_value, not_detected = excluded.not_detected,
         nd_text = excluded.nd_text, print_note = excluded.print_note, print_text = excluded.print_text`,
      [specId, r.analyte.trim(), r.minValue, r.maxValue, r.notDetected, r.ndText.trim(), r.printNote.trim(), r.printText.trim()],
    );
    n++;
  }
  return n;
}

/** Copy cột quy chuẩn (thông tin + toàn bộ giới hạn chỉ tiêu) thành cột mới tên "… (bản sao)". */
export async function copySpecification(id: string): Promise<string | null> {
  const [row] = await dbQuery(
    `insert into public.specifications (name, column_name, sample_type_id, note, active, print_name, print_note, standard_id, english_name)
     select name, coalesce(nullif(column_name, ''), name) || ' (bản sao)', sample_type_id, note, active, print_name, print_note, standard_id, english_name
     from public.specifications where id = $1 returning id`,
    [id],
  );
  if (!row) return null;
  await dbQuery(
    `insert into public.specification_limits (spec_id, analyte, min_value, max_value, note, not_detected, nd_text, print_note, print_text)
     select $2, analyte, min_value, max_value, note, not_detected, nd_text, print_note, print_text from public.specification_limits where spec_id = $1`,
    [id, row.id],
  );
  return row.id as string;
}

/** Khoản của "Cài đặt định mức" (migration 0041): định mức × đơn giá; có khoản thì đơn giá định mức của chỉ tiêu = tổng các khoản. */
export const NORM_CATEGORIES = ["Dụng cụ lấy mẫu", "Thiết bị HT", "Vật liệu HT", "Dụng cụ phân tích", "Thiết bị PTN", "Vật liệu PTN", "Nhân công"] as const;
export type NormPart = { id: string; itemId: string; category: string; name: string; quantity: number; unitPrice: number; sort: number };
export const normPartStore = createEntityStore<NormPart>(
  "norm-item-parts",
  [],
  columnsMapping<NormPart>("norm_item_parts", { itemId: "ref", category: "text", name: "text", quantity: "number", unitPrice: "number", sort: "number" }),
);

/** Ghi đè các khoản định mức của một dòng bảng định mức và cập nhật đơn giá định mức = tổng (định mức × đơn giá). */
export async function saveNormParts(itemId: string, parts: Omit<NormPart, "id" | "itemId" | "sort">[]) {
  await dbQuery(`delete from public.norm_item_parts where item_id = $1`, [itemId]);
  let total = 0;
  for (const [i, p] of parts.entries()) {
    await dbQuery(`insert into public.norm_item_parts (item_id, category, name, quantity, unit_price, sort) values ($1, $2, $3, $4, $5, $6)`, [itemId, p.category, p.name, p.quantity, p.unitPrice, i + 1]);
    total += p.quantity * p.unitPrice;
  }
  if (parts.length) await dbQuery(`update public.rate_items set amount = $2 where id = $1`, [itemId, Math.round(total)]);
  return Math.round(total);
}

/** Ghi giá / định mức của các chỉ tiêu một loại mẫu trong bảng: có đơn giá thì thêm / sửa, để trống thì bỏ khỏi bảng. */
export async function saveRateRows(listId: string, sampleTypeId: string, rows: { analyte: string; amount: number | null; cost: number | null }[]) {
  let n = 0;
  for (const r of rows) {
    const analyte = r.analyte.trim();
    if (!analyte) continue;
    if (r.amount == null) {
      await dbQuery(`delete from public.rate_items where list_id = $1 and sample_type_id = $2 and analyte = $3`, [listId, sampleTypeId, analyte]);
      continue;
    }
    await dbQuery(
      `insert into public.rate_items (list_id, sample_type_id, analyte, amount, cost) values ($1, $2, $3, $4, $5)
       on conflict (list_id, sample_type_id, analyte) do update set amount = excluded.amount, cost = excluded.cost`,
      [listId, sampleTypeId, analyte, r.amount, r.cost],
    );
    n++;
  }
  return n;
}

/** Copy bảng giá / định mức (kèm các chỉ tiêu và khoản định mức) thành bảng mới "… (bản sao)". */
export async function copyRateList(id: string): Promise<string | null> {
  const [row] = await dbQuery(
    `insert into public.rate_lists (kind, name, note, active, cost_price) select kind, name || ' (bản sao)', note, active, cost_price from public.rate_lists where id = $1 returning id`,
    [id],
  );
  if (!row) return null;
  const items = await dbQuery(`select id, sample_type_id, analyte, amount, cost from public.rate_items where list_id = $1`, [id]);
  for (const it of items) {
    const [n] = await dbQuery(`insert into public.rate_items (list_id, sample_type_id, analyte, amount, cost) values ($1, $2, $3, $4, $5) returning id`, [row.id, it.sample_type_id, it.analyte, it.amount, it.cost]);
    await dbQuery(
      `insert into public.norm_item_parts (item_id, category, name, quantity, unit_price, sort) select $2, category, name, quantity, unit_price, sort from public.norm_item_parts where item_id = $1`,
      [it.id, n.id],
    );
  }
  return row.id as string;
}
