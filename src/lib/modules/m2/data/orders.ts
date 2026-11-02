// Đơn hàng, loại mẫu, chỉ tiêu, quy chuẩn (migration 0025) và các truy vấn ghép cho trang đơn hàng.
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import type { DecimalRules, EnvConditions } from "@/lib/modules/m2/orders";

export type Order = {
  id: string;
  code: string;
  name: string;
  kind: string;
  customerId: string;
  contact: string;
  location: string;
  contractNo: string;
  requestingUnit: string;
  fieldAt: string;
  receivedAt: string;
  dueAt: string;
  internalDueAt: string;
  deliveredAt: string;
  disposeAt: string;
  salesStaff: string;
  fieldStaff: string;
  signer: string;
  qaStaff: string;
  deliveryMethod: string;
  reportNo: string;
  status: string;
  note: string;
  createdBy: string;
  createdAt: string;
  quoteNo: string;
  quotedAt: string;
  amount: number;
  discountPct: number;
  vatRate: number;
  priceListId: string;
  contactId: string;
  locationId: string;
};

export const orderStore = createEntityStore<Order>(
  "orders",
  [],
  columnsMapping<Order>("orders", {
    code: "text",
    name: "text",
    kind: "text",
    customerId: "ref",
    contact: "text",
    location: "text",
    contractNo: "text",
    requestingUnit: "text",
    fieldAt: "date",
    receivedAt: "date",
    dueAt: "date",
    internalDueAt: "date",
    deliveredAt: "date",
    disposeAt: "date",
    salesStaff: "text",
    fieldStaff: "text",
    signer: "text",
    qaStaff: "text",
    deliveryMethod: "text",
    reportNo: "text",
    status: "text",
    note: "text",
    createdBy: "text",
    createdAt: "date",
    quoteNo: "text",
    quotedAt: "date",
    amount: "number",
    discountPct: "number",
    vatRate: "number",
    priceListId: "ref",
    contactId: "ref",
    locationId: "ref",
  }),
);

/** Mẫu (yêu cầu) nhìn từ đơn hàng – cùng bảng samples, thêm các cột của đơn hàng. */
export type OrderSample = {
  id: string;
  code: string;
  customerId: string;
  customer: string;
  type: string;
  receivedAt: string;
  dueAt: string;
  status: string;
  criteria: string[];
  orderId: string;
  sampleTypeId: string;
  locationName: string;
  customerSampleCode: string;
  isQc: boolean;
  isDuplicate: boolean;
  sampledAt: string;
  stage: string;
  specId: string;
  spec2Id: string;
  pointId: string;
  disposeAt: string;
  sampler: string;
  sampleCondition: string;
  sampleQuantity: string;
  lat: number | null;
  lng: number | null;
  envConditions: EnvConditions;
};

export const orderSampleStore = createEntityStore<OrderSample>(
  "order-samples",
  [],
  columnsMapping<OrderSample>("samples", {
    code: "text",
    customerId: "ref",
    customer: "text",
    type: "text",
    receivedAt: "date",
    dueAt: "date",
    status: "text",
    criteria: "json",
    orderId: "ref",
    sampleTypeId: "ref",
    locationName: "text",
    customerSampleCode: "text",
    isQc: "bool",
    isDuplicate: "bool",
    sampledAt: "date",
    stage: "text",
    specId: "ref",
    spec2Id: "ref",
    pointId: "ref",
    disposeAt: "date",
    sampler: "text",
    sampleCondition: "text",
    sampleQuantity: "text",
    lat: "optnum",
    lng: "optnum",
    envConditions: "json",
  }),
);

export type SampleType = {
  id: string;
  name: string;
  prefix: string;
  sort: number;
  defaultContainer: string;
  description: string;
  active: boolean;
  hazardous: boolean;
  minQuantity: string;
  recordTemplate: string;
};
export const sampleTypeStore = createEntityStore<SampleType>(
  "sample-types",
  [],
  columnsMapping<SampleType>("sample_types", {
    name: "text",
    prefix: "text",
    sort: "number",
    defaultContainer: "text",
    description: "text",
    active: "bool",
    hazardous: "bool",
    minQuantity: "text",
    recordTemplate: "text",
  }),
);

export type LabAnalyte = {
  id: string;
  sampleTypeId: string;
  name: string;
  groupName: string;
  unit: string;
  method: string;
  loq: string;
  scope: string;
  accreditedNo: number | null;
  sort: number;
  active: boolean;
  unitPrice: number;
  printName: string;
  abbreviation: string;
  isField: boolean;
  note: string;
  formulaCode: string;
  industry: string;
  spec1Id: string;
  spec2Id: string;
  decimals: DecimalRules | null;
};
export const analyteStore = createEntityStore<LabAnalyte>(
  "lab-analytes",
  [],
  columnsMapping<LabAnalyte>("lab_analytes", {
    sampleTypeId: "ref",
    name: "text",
    groupName: "text",
    unit: "text",
    method: "text",
    loq: "text",
    scope: "text",
    accreditedNo: "optnum",
    sort: "number",
    active: "bool",
    unitPrice: "number",
    printName: "text",
    abbreviation: "text",
    isField: "bool",
    note: "text",
    formulaCode: "text",
    industry: "text",
    spec1Id: "ref",
    spec2Id: "ref",
    decimals: "json",
  }),
);

export type Specification = { id: string; name: string; columnName: string; sampleTypeId: string; note: string; active: boolean; printName: string; printNote: string };
export const specificationStore = createEntityStore<Specification>(
  "specifications",
  [],
  columnsMapping<Specification>("specifications", { name: "text", columnName: "text", sampleTypeId: "ref", note: "text", active: "bool", printName: "text", printNote: "text" }),
);

export type SpecLimit = { id: string; specId: string; analyte: string; minValue: number | null; maxValue: number | null; note: string; notDetected: boolean; ndText: string; printNote: string };
export const specLimitStore = createEntityStore<SpecLimit>(
  "specification-limits",
  [],
  columnsMapping<SpecLimit>("specification_limits", { specId: "ref", analyte: "text", minValue: "optnum", maxValue: "optnum", note: "text", notDetected: "bool", ndText: "text", printNote: "text" }),
);


// ── Dòng kết quả của đơn hàng (bảng analysis_results) ──────────────

export type OrderLine = {
  id: string;
  resultCode: string;
  sampleCode: string;
  criterion: string;
  unit: string;
  method: string;
  subcontractor: string;
  prefix: string;
  mean: number;
  status: string;
  technician: string;
  sort: number;
  batchId: string;
  matrix: string;
  samplingTimes: number;
  lineKind: string;
  /** Người được phân công phân tích. */
  analyst: string;
  /** Các lần đo đã nhập (dạng ô: "7,2", "<0,05", "KPH"). */
  reps: string[];
};

const LINE_COLS = `r.id, r.result_code, r.sample_code, r.criterion, r.unit, r.method, r.subcontractor, r.result_prefix,
            r.mean, r.status, r.technician, coalesce(r.sort, 0) sort, r.batch_id, r.matrix, r.sampling_times, r.line_kind, r.analyst, r.replicates`;

/** Các dòng kết quả thuộc những mẫu của đơn hàng, theo thứ tự mẫu → thứ tự chỉ tiêu. */
export async function orderLines(orderId: string): Promise<OrderLine[]> {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select ${LINE_COLS}
     from public.analysis_results r
     join public.samples s on s.code = r.sample_code
     where s.order_id = $1
     order by s.code, coalesce(r.sort, 0), r.criterion`,
    [orderId],
  );
  return rows.map(toLine);
}

/** Các dòng kết quả đã đưa vào một mẻ thử nghiệm. */
export async function batchLines(batchId: string): Promise<OrderLine[]> {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select ${LINE_COLS} from public.analysis_results r where r.batch_id = $1 order by r.sample_code, coalesce(r.sort, 0), r.criterion`,
    [batchId],
  );
  return rows.map(toLine);
}

/** Dòng kết quả chưa thuộc mẻ nào (để chọn đưa vào mẻ), lọc theo phương pháp và ngày nhận mẫu. */
export async function freeLines(f: { method?: string; from?: string; to?: string }) {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select ${LINE_COLS}, s.received_at, s.is_qc, s.is_duplicate
     from public.analysis_results r join public.samples s on s.code = r.sample_code
     where r.batch_id is null and r.status in ('Đang nhập', 'Trả lại sửa')
       and ($1 = '' or r.method = $1)
       and ($2 = '' or s.received_at >= $2::date) and ($3 = '' or s.received_at <= $3::date)
     order by s.received_at desc nulls last, r.sample_code, coalesce(r.sort, 0) limit 500`,
    [f.method ?? "", f.from ?? "", f.to ?? ""],
  );
  return rows.map((r) => ({ ...toLine(r), receivedAt: (r.received_at as string) ?? "", isQc: Boolean(r.is_qc), isDuplicate: Boolean(r.is_duplicate) }));
}

/** Lần đo lưu dạng [{ id, value, text }]; bản ghi cũ chỉ có value. */
function repTexts(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x: { value?: number | null; text?: string }) => x?.text ?? (x?.value === null || x?.value === undefined ? "" : String(x.value).replace(".", ",")));
}

function toLine(r: Record<string, unknown>): OrderLine {
  return {
    id: r.id as string,
    resultCode: (r.result_code as string) ?? "",
    sampleCode: (r.sample_code as string) ?? "",
    criterion: (r.criterion as string) ?? "",
    unit: (r.unit as string) ?? "",
    method: (r.method as string) ?? "",
    subcontractor: (r.subcontractor as string) ?? "",
    prefix: (r.result_prefix as string) ?? "",
    mean: r.mean === null || r.mean === undefined ? NaN : Number(r.mean),
    status: (r.status as string) || "Đang nhập",
    technician: (r.technician as string) ?? "",
    sort: Number(r.sort) || 0,
    batchId: (r.batch_id as string) ?? "",
    matrix: (r.matrix as string) ?? "",
    samplingTimes: Number(r.sampling_times) || 1,
    lineKind: (r.line_kind as string) ?? "",
    analyst: (r.analyst as string) ?? "",
    reps: repTexts(r.replicates),
  };
}

/** Tóm tắt từng đơn: số mẫu, số dòng kết quả, số dòng đã duyệt. */
export async function orderProgress(): Promise<Map<string, { samples: number; lines: number; approved: number }>> {
  if (!isDbConfigured()) return new Map();
  const rows = await dbQuery(
    `select s.order_id, count(distinct s.id)::int samples, count(r.id)::int lines,
            count(r.id) filter (where r.status = 'Đã duyệt')::int approved
     from public.samples s left join public.analysis_results r on r.sample_code = s.code
     where s.order_id is not null group by s.order_id`,
  ).catch(() => []);
  return new Map(rows.map((r) => [r.order_id as string, { samples: Number(r.samples), lines: Number(r.lines), approved: Number(r.approved) }]));
}

/** Mã mẫu đã dùng có tiền tố cho trước (để sinh mã kế tiếp). */
export async function sampleCodesLike(prefix: string) {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(`select code from public.samples where code like $1`, [`${prefix}%`]);
  return rows.map((r) => r.code as string);
}

// ── Bảng tin, lịch công tác, mẻ thử nghiệm (migration 0026) ─────────

export type LabPost = { id: string; author: string; body: string; createdAt: string };
export const labPostStore = createEntityStore<LabPost>("lab-posts", [], columnsMapping<LabPost>("lab_posts", { author: "text", body: "text", createdAt: "date" }));

export type WorkItem = { id: string; staffName: string; day: string; kind: string; title: string; hours: number | null; orderId: string; note: string; createdBy: string };
export const workScheduleStore = createEntityStore<WorkItem>(
  "work-schedule",
  [],
  columnsMapping<WorkItem>("work_schedule", { staffName: "text", day: "date", kind: "text", title: "text", hours: "optnum", orderId: "ref", note: "text", createdBy: "text" }),
);

export type TestBatch = {
  id: string;
  code: string;
  method: string;
  analyst: string;
  instrumentCode: string;
  chemicals: string;
  startedAt: string;
  finishedAt: string;
  status: string;
  note: string;
  createdBy: string;
  createdAt: string;
};
export const testBatchStore = createEntityStore<TestBatch>(
  "test-batches",
  [],
  columnsMapping<TestBatch>("test_batches", {
    code: "text",
    method: "text",
    analyst: "text",
    instrumentCode: "text",
    chemicals: "text",
    startedAt: "date",
    finishedAt: "date",
    status: "text",
    note: "text",
    createdBy: "text",
    createdAt: "date",
  }),
);

/** Đưa / gỡ các dòng kết quả vào mẻ (chỉ dòng chưa nộp duyệt). */
export async function setLinesBatch(lineIds: string[], batchId: string | null) {
  if (!lineIds.length) return 0;
  const rows = await dbQuery(
    `update public.analysis_results set batch_id = $2
     where id = any($1::uuid[]) and status in ('Đang nhập', 'Trả lại sửa') and ($2::uuid is null or batch_id is null or batch_id = $2::uuid)
     returning id`,
    [lineIds, batchId],
  );
  return rows.length;
}

/** Số dòng kết quả trong từng mẻ: tổng / đã duyệt. */
export async function batchProgress(): Promise<Map<string, { lines: number; approved: number }>> {
  if (!isDbConfigured()) return new Map();
  const rows = await dbQuery(
    `select batch_id, count(*)::int lines, count(*) filter (where status = 'Đã duyệt')::int approved
     from public.analysis_results where batch_id is not null group by batch_id`,
  ).catch(() => []);
  return new Map(rows.map((r) => [r.batch_id as string, { lines: Number(r.lines), approved: Number(r.approved) }]));
}

/** Số dòng kết quả ở các trạng thái cho trước, gom theo đơn hàng (việc chờ duyệt / chờ sửa). */
export async function linesByOrder(statuses: string[], technician?: string) {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select o.id, o.code, o.name, count(*)::int n
     from public.analysis_results r
     join public.samples s on s.code = r.sample_code
     join public.orders o on o.id = s.order_id
     where r.status = any($1::text[]) and ($2 = '' or r.technician = $2)
     group by o.id, o.code, o.name order by o.code desc`,
    [statuses, technician ?? ""],
  ).catch(() => []);
  return rows.map((r) => ({ id: r.id as string, code: r.code as string, name: r.name as string, n: Number(r.n) }));
}

// ── Báo giá & công nợ (migration 0027) ──────────────────────────────

export type OrderPayment = { id: string; orderId: string; amount: number; paidAt: string; method: string; note: string; createdBy: string };
export const orderPaymentStore = createEntityStore<OrderPayment>(
  "order-payments",
  [],
  columnsMapping<OrderPayment>("order_payments", { orderId: "ref", amount: "number", paidAt: "date", method: "text", note: "text", createdBy: "text" }),
);

// ── Trang "Kết quả" (tra cứu / xuất / nhập kết quả theo khoảng ngày, mã mẫu) ──

export type ResultQuery = { by: "quan-trac" | "nhan-mau" | "ma-mau"; from?: string; to?: string; method?: string; typeId?: string; criterion?: string; code?: string };
export type ResultRowLine = OrderLine & { locationName: string; customerSampleCode: string; fieldAt: string; receivedAt: string };

/** Dòng kết quả thuộc các mẫu của đơn hàng theo bộ lọc của trang Kết quả (tối đa 5000 dòng). */
export async function searchResultLines(f: ResultQuery): Promise<ResultRowLine[]> {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select ${LINE_COLS}, s.location_name, s.customer_sample_code, o.field_at, s.received_at
     from public.analysis_results r
     join public.samples s on s.code = r.sample_code
     join public.orders o on o.id = s.order_id
     where ($1 <> 'quan-trac' or (($2 = '' or (o.field_at at time zone 'Asia/Ho_Chi_Minh')::date >= $2::date) and ($3 = '' or (o.field_at at time zone 'Asia/Ho_Chi_Minh')::date <= $3::date) and o.field_at is not null))
       and ($1 <> 'nhan-mau' or (($2 = '' or s.received_at >= $2::date) and ($3 = '' or s.received_at <= $3::date) and s.received_at is not null))
       and ($1 <> 'ma-mau' or s.code ilike '%' || $7 || '%' or s.customer_sample_code ilike '%' || $7 || '%')
       and ($4 = '' or r.method = $4)
       and ($5 = '' or s.sample_type_id::text = $5)
       and ($6 = '' or lower(r.criterion) = lower($6))
     order by s.code, coalesce(r.sort, 0), r.criterion
     limit 5000`,
    [f.by, f.from ?? "", f.to ?? "", f.method ?? "", f.typeId ?? "", f.criterion ?? "", f.code ?? ""],
  );
  return rows.map((r) => ({
    ...toLine(r),
    locationName: (r.location_name as string) ?? "",
    customerSampleCode: (r.customer_sample_code as string) ?? "",
    fieldAt: (r.field_at as string) ?? "",
    receivedAt: (r.received_at as string) ?? "",
  }));
}

/** Dòng kết quả theo danh sách mã mẫu (để nhập kết quả từ file). */
export async function linesBySampleCodes(codes: string[]): Promise<OrderLine[]> {
  if (!isDbConfigured() || !codes.length) return [];
  const rows = await dbQuery(`select ${LINE_COLS} from public.analysis_results r where r.sample_code = any($1::text[])`, [codes]);
  return rows.map(toLine);
}
