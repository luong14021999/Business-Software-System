// Đơn hàng, loại mẫu, chỉ tiêu, quy chuẩn (migration 0025) và các truy vấn ghép cho trang đơn hàng.
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

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
  }),
);

export type SampleType = { id: string; name: string; prefix: string; sort: number; defaultContainer: string; description: string; active: boolean };
export const sampleTypeStore = createEntityStore<SampleType>(
  "sample-types",
  [],
  columnsMapping<SampleType>("sample_types", { name: "text", prefix: "text", sort: "number", defaultContainer: "text", description: "text", active: "bool" }),
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
  }),
);

export type Specification = { id: string; name: string; columnName: string; sampleTypeId: string; note: string; active: boolean };
export const specificationStore = createEntityStore<Specification>(
  "specifications",
  [],
  columnsMapping<Specification>("specifications", { name: "text", columnName: "text", sampleTypeId: "ref", note: "text", active: "bool" }),
);

export type SpecLimit = { id: string; specId: string; analyte: string; minValue: number | null; maxValue: number | null; note: string };
export const specLimitStore = createEntityStore<SpecLimit>(
  "specification-limits",
  [],
  columnsMapping<SpecLimit>("specification_limits", { specId: "ref", analyte: "text", minValue: "optnum", maxValue: "optnum", note: "text" }),
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
};

/** Các dòng kết quả thuộc những mẫu của đơn hàng, theo thứ tự mẫu → thứ tự chỉ tiêu. */
export async function orderLines(orderId: string): Promise<OrderLine[]> {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(
    `select r.id, r.result_code, r.sample_code, r.criterion, r.unit, r.method, r.subcontractor, r.result_prefix,
            r.mean, r.status, r.technician, coalesce(r.sort, 0) sort
     from public.analysis_results r
     join public.samples s on s.code = r.sample_code
     where s.order_id = $1
     order by s.code, coalesce(r.sort, 0), r.criterion`,
    [orderId],
  );
  return rows.map((r) => ({
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
  }));
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
