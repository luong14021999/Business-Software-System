// Khách hàng (liên hệ, địa điểm, vị trí quan trắc), tài liệu lưu trữ, báo giá phiên bản, quy chuẩn theo loại mẫu (migration 0030).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery } from "@/lib/platform/db";
import type { QuoteItem } from "@/lib/modules/m2/orders";

export type CustomerContact = { id: string; customerId: string; name: string; title: string; phone: string; email: string; note: string };
export const contactStore = createEntityStore<CustomerContact>(
  "customer-contacts",
  [],
  columnsMapping<CustomerContact>("customer_contacts", { customerId: "ref", name: "text", title: "text", phone: "text", email: "text", note: "text" }),
);

export type CustomerLocation = { id: string; customerId: string; name: string; oldName: string; description: string };
export const locationStore = createEntityStore<CustomerLocation>(
  "customer-locations",
  [],
  columnsMapping<CustomerLocation>("customer_locations", { customerId: "ref", name: "text", oldName: "text", description: "text" }),
);

export type MonitoringPoint = { id: string; locationId: string; name: string; description: string; lat: number | null; lng: number | null };
export const pointStore = createEntityStore<MonitoringPoint>(
  "monitoring-points",
  [],
  columnsMapping<MonitoringPoint>("monitoring_points", { locationId: "ref", name: "text", description: "text", lat: "optnum", lng: "optnum" }),
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
    note: "text",
    lines: "json",
    total: "number",
    createdBy: "text",
    createdAt: "date",
  }),
);

export type OrderTypeSpec = { id: string; orderId: string; sampleTypeId: string; spec1Id: string; spec2Id: string };
export const orderTypeSpecStore = createEntityStore<OrderTypeSpec>(
  "order-type-specs",
  [],
  columnsMapping<OrderTypeSpec>("order_type_specs", { orderId: "ref", sampleTypeId: "ref", spec1Id: "ref", spec2Id: "ref" }),
);

/** Ghi quy chuẩn của một loại mẫu cho đơn (tạo mới hoặc thay). */
export async function upsertTypeSpec(orderId: string, sampleTypeId: string, spec1Id: string, spec2Id: string) {
  await dbQuery(
    `insert into public.order_type_specs (order_id, sample_type_id, spec1_id, spec2_id) values ($1, $2, nullif($3, '')::uuid, nullif($4, '')::uuid)
     on conflict (order_id, sample_type_id) do update set spec1_id = excluded.spec1_id, spec2_id = excluded.spec2_id`,
    [orderId, sampleTypeId, spec1Id, spec2Id],
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
