// Khách hàng (liên hệ, địa điểm, vị trí quan trắc), tài liệu lưu trữ, báo giá phiên bản, quy chuẩn theo loại mẫu (migration 0030).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery } from "@/lib/platform/db";
import type { QuoteItem } from "@/lib/modules/m2/orders";

export type CustomerContact = { id: string; customerId: string; name: string; title: string; phone: string; email: string; note: string; salutation: string; department: string; phone2: string };
export const contactStore = createEntityStore<CustomerContact>(
  "customer-contacts",
  [],
  columnsMapping<CustomerContact>("customer_contacts", { customerId: "ref", name: "text", title: "text", phone: "text", email: "text", note: "text", salutation: "text", department: "text", phone2: "text" }),
);

export type CustomerLocation = { id: string; customerId: string; name: string; oldName: string; description: string; englishName: string };
export const locationStore = createEntityStore<CustomerLocation>(
  "customer-locations",
  [],
  columnsMapping<CustomerLocation>("customer_locations", { customerId: "ref", name: "text", oldName: "text", description: "text", englishName: "text" }),
);

export type MonitoringPoint = { id: string; locationId: string; name: string; description: string; lat: number | null; lng: number | null; englishName: string; sort: number; active: boolean };
export const pointStore = createEntityStore<MonitoringPoint>(
  "monitoring-points",
  [],
  columnsMapping<MonitoringPoint>("monitoring_points", { locationId: "ref", name: "text", description: "text", lat: "optnum", lng: "optnum", englishName: "text", sort: "number", active: "bool" }),
);

export type OrderDocument = { id: string; orderId: string; kind: string; url: string; note: string; createdBy: string; createdAt: string };
export const orderDocumentStore = createEntityStore<OrderDocument>(
  "order-documents",
  [],
  columnsMapping<OrderDocument>("order_documents", { orderId: "ref", kind: "text", url: "text", note: "text", createdBy: "text", createdAt: "date" }),
);

export type OrderQuote = {
  id: string;
  orderId: string;
  kind: "after" | "before";
  code: string;
  quotedAt: string;
  discountPct: number;
  vatRate: number;
  managementFeePct: number;
  note: string;
  lines: QuoteItem[];
  total: number;
  createdBy: string;
  createdAt: string;
};
export const orderQuoteStore = createEntityStore<OrderQuote>(
  "order-quotes",
  [],
  columnsMapping<OrderQuote>("order_quotes", {
    orderId: "ref",
    kind: "text",
    code: "text",
    quotedAt: "date",
    discountPct: "number",
    vatRate: "number",
    managementFeePct: "number",
    note: "text",
    lines: "json",
    total: "number",
    createdBy: "text",
    createdAt: "date",
  }),
);

export type OrderTypeSpec = { id: string; orderId: string; sampleTypeId: string; spec1Id: string; spec2Id: string; standardIds: string[]; specIds: string[] };
export const orderTypeSpecStore = createEntityStore<OrderTypeSpec>(
  "order-type-specs",
  [],
  columnsMapping<OrderTypeSpec>("order_type_specs", { orderId: "ref", sampleTypeId: "ref", spec1Id: "ref", spec2Id: "ref", standardIds: "json", specIds: "json" }),
);

/** Ghi quy chuẩn của một loại mẫu cho đơn (tạo mới hoặc thay): tối đa 10 quy chuẩn và 10 cột; cột 1, 2 dùng cho lưới / bản in. */
export async function upsertTypeSpec(orderId: string, sampleTypeId: string, standardIds: string[], specIds: string[]) {
  const cols = specIds.slice(0, 10);
  await dbQuery(
    `insert into public.order_type_specs (order_id, sample_type_id, spec1_id, spec2_id, standard_ids, spec_ids)
     values ($1, $2, nullif($3, '')::uuid, nullif($4, '')::uuid, $5::jsonb, $6::jsonb)
     on conflict (order_id, sample_type_id) do update set spec1_id = excluded.spec1_id, spec2_id = excluded.spec2_id,
       standard_ids = excluded.standard_ids, spec_ids = excluded.spec_ids`,
    [orderId, sampleTypeId, cols[0] ?? "", cols[1] ?? "", JSON.stringify(standardIds.slice(0, 10)), JSON.stringify(cols)],
  );
}

/** "Áp quy chuẩn cho tất cả yêu cầu": chép quy chuẩn theo loại mẫu xuống các mẫu của đơn. */
export async function applyTypeSpecs(orderId: string) {
  const rows = await dbQuery(
    `update public.samples s set spec_id = t.spec1_id, spec2_id = t.spec2_id
     from public.order_type_specs t
     where t.order_id = $1 and s.order_id = $1 and s.sample_type_id = t.sample_type_id
     returning s.id`,
    [orderId],
  );
  return rows.length;
}

/** "Áp cho tất cả yêu cầu": đặt cùng mốc ngày cho mọi mẫu của đơn. */
export async function applyOrderDates(orderId: string, d: { sampledAt?: string; receivedAt?: string; dueAt?: string; disposeAt?: string }) {
  const sets: string[] = [];
  const params: unknown[] = [orderId];
  const add = (col: string, v: string | undefined, cast: string) => {
    if (v === undefined) return;
    params.push(v || null);
    sets.push(`${col} = $${params.length}::${cast}`);
  };
  add("sampled_at", d.sampledAt, "timestamptz");
  add("received_at", d.receivedAt, "date");
  add("due_at", d.dueAt, "date");
  add("dispose_at", d.disposeAt, "date");
  if (!sets.length) return 0;
  const rows = await dbQuery(`update public.samples set ${sets.join(", ")} where order_id = $1 returning id`, params);
  return rows.length;
}

// ── Kế hoạch quan trắc của đơn hàng (migration 0031) ────────────────

export type OrderPlan = {
  id: string;
  orderId: string;
  leader: string;
  supervisor: string;
  deputy1: string;
  deputy2: string;
  /** Các nhóm quan trắc, mỗi nhóm là danh sách tên. */
  groups: string[][];
  startAt: string;
  endAt: string;
  vehicle: string;
  note: string;
  updatedBy: string;
  updatedAt: string;
};
export const orderPlanStore = createEntityStore<OrderPlan>(
  "order-plans",
  [],
  columnsMapping<OrderPlan>("order_plans", {
    orderId: "ref",
    leader: "text",
    supervisor: "text",
    deputy1: "text",
    deputy2: "text",
    groups: "json",
    startAt: "date",
    endAt: "date",
    vehicle: "text",
    note: "text",
    updatedBy: "text",
    updatedAt: "date",
  }),
);

export type PlanItem = { id: string; orderId: string; kind: string; name: string; quantity: string; note: string; sort: number };
export const planItemStore = createEntityStore<PlanItem>(
  "order-plan-items",
  [],
  columnsMapping<PlanItem>("order_plan_items", { orderId: "ref", kind: "text", name: "text", quantity: "text", note: "text", sort: "number" }),
);

/** Kế hoạch của một đơn (null nếu chưa lập). */
export async function planOf(orderId: string) {
  return (await orderPlanStore.list()).find((p) => p.orderId === orderId) ?? null;
}

/** Ghi đè kế hoạch và toàn bộ danh sách thiết bị / vật tư / bảo quản của đơn. */
export async function savePlan(orderId: string, p: Omit<OrderPlan, "id" | "orderId" | "updatedAt">, items: Omit<PlanItem, "id" | "orderId">[]) {
  await dbQuery(
    `insert into public.order_plans (order_id, leader, supervisor, deputy1, deputy2, groups, start_at, end_at, vehicle, note, updated_by, updated_at)
     values ($1, $2, $3, $4, $5, $6::jsonb, nullif($7, '')::date, nullif($8, '')::date, $9, $10, $11, now())
     on conflict (order_id) do update set leader = excluded.leader, supervisor = excluded.supervisor, deputy1 = excluded.deputy1,
       deputy2 = excluded.deputy2, groups = excluded.groups, start_at = excluded.start_at, end_at = excluded.end_at,
       vehicle = excluded.vehicle, note = excluded.note, updated_by = excluded.updated_by, updated_at = now()`,
    [orderId, p.leader, p.supervisor, p.deputy1, p.deputy2, JSON.stringify(p.groups), p.startAt, p.endAt, p.vehicle, p.note, p.updatedBy],
  );
  await dbQuery(`delete from public.order_plan_items where order_id = $1`, [orderId]);
  for (const [i, it] of items.entries()) {
    await dbQuery(
      `insert into public.order_plan_items (order_id, kind, name, quantity, note, sort) values ($1, $2, $3, $4, $5, $6)`,
      [orderId, it.kind, it.name, it.quantity, it.note, i + 1],
    );
  }
}

/** Chỉ lưu nhân sự đoàn quan trắc (trang "Nhân sự quan trắc"), giữ nguyên thời gian / phương tiện / vật tư. */
export async function savePlanTeam(orderId: string, p: Pick<OrderPlan, "leader" | "supervisor" | "deputy1" | "deputy2" | "groups" | "updatedBy">) {
  await dbQuery(
    `insert into public.order_plans (order_id, leader, supervisor, deputy1, deputy2, groups, updated_by, updated_at)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, now())
     on conflict (order_id) do update set leader = excluded.leader, supervisor = excluded.supervisor, deputy1 = excluded.deputy1,
       deputy2 = excluded.deputy2, groups = excluded.groups, updated_by = excluded.updated_by, updated_at = now()`,
    [orderId, p.leader, p.supervisor, p.deputy1, p.deputy2, JSON.stringify(p.groups), p.updatedBy],
  );
}

/** Ghi đè các dòng thiết bị / vật tư / bảo quản của những loại `kinds`, giữ nguyên loại khác. */
export async function replacePlanItems(orderId: string, kinds: string[], items: Omit<PlanItem, "id" | "orderId">[]) {
  await dbQuery(`delete from public.order_plan_items where order_id = $1 and kind = any($2::text[])`, [orderId, kinds]);
  for (const [i, it] of items.entries()) {
    await dbQuery(`insert into public.order_plan_items (order_id, kind, name, quantity, note, sort) values ($1, $2, $3, $4, $5, $6)`, [orderId, it.kind, it.name, it.quantity, it.note, i + 1]);
  }
}

/** Gợi ý thiết bị quan trắc / dụng cụ chứa / bảo quản / hóa chất lấy mẫu từ các tab tương ứng của chỉ tiêu trong đơn. */
export async function suggestPlanItems(orderId: string) {
  const rows = await dbQuery(
    `select r.kind, r.name, count(distinct s.id)::int samples
     from public.samples s
     join public.analysis_results ar on ar.sample_code = s.code
     join public.lab_analytes a on a.sample_type_id = s.sample_type_id and lower(a.name) = lower(ar.criterion)
     join public.analyte_resources r on r.analyte_id = a.id
     where s.order_id = $1 and r.kind in ('instrument', 'container', 'preservation', 'chemical')
     group by r.kind, r.name order by r.kind, r.name`,
    [orderId],
  );
  const kindOf: Record<string, string> = { instrument: "Thiết bị", container: "Vật tư – hóa chất", preservation: "Bảo quản" };
  return rows.map((r) => ({
    kind: kindOf[r.kind as string] ?? "Vật tư – hóa chất",
    name: r.name as string,
    quantity: r.kind === "instrument" ? "1" : String(r.samples),
    note: r.kind === "container" ? "Dụng cụ chứa mẫu" : r.kind === "chemical" ? "Hóa chất lấy mẫu" : "",
  }));
}

export type SamplePreservation = { id: string; sampleId: string; preservationId: string };
export const samplePreservationStore = createEntityStore<SamplePreservation>(
  "sample-preservations",
  [],
  columnsMapping<SamplePreservation>("sample_preservations", { sampleId: "ref", preservationId: "ref" }),
);
