// Danh mục Cài đặt bổ sung theo XaLab (migration 0033): phòng ban, nhóm dụng cụ, công thức, loại kế hoạch…
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";

export type Department = { id: string; name: string; code: string; sort: number };
export const departmentStore = createEntityStore<Department>("departments", [], columnsMapping<Department>("departments", { name: "text", code: "text", sort: "number" }));

export type SamplingContainer = { id: string; name: string; symbol: string; unit: string; description: string; containerType: string; lifetimeMonths: string };
export const samplingContainerStore = createEntityStore<SamplingContainer>(
  "sampling-containers",
  [],
  columnsMapping<SamplingContainer>("sampling_containers", { name: "text", symbol: "text", unit: "text", description: "text", containerType: "text", lifetimeMonths: "text" }),
);

export type LabFormula = { id: string; name: string; formula: string; fieldVariables: string; description: string };
export const labFormulaStore = createEntityStore<LabFormula>(
  "lab-formulas",
  [],
  columnsMapping<LabFormula>("lab_formulas", { name: "text", formula: "text", fieldVariables: "text", description: "text" }),
);

export type LabProduct = { id: string; name: string; code: string; unit: string; description: string; lifetimeMonths: string };
export const labProductStore = createEntityStore<LabProduct>(
  "lab-products",
  [],
  columnsMapping<LabProduct>("lab_products", { name: "text", code: "text", unit: "text", description: "text", lifetimeMonths: "text" }),
);

export type EventType = { id: string; name: string; description: string; sort: number };
export const eventTypeStore = createEntityStore<EventType>("event-types", [], columnsMapping<EventType>("event_types", { name: "text", description: "text", sort: "number" }));

export type Industry = { id: string; name: string; description: string };
export const industryStore = createEntityStore<Industry>("industries", [], columnsMapping<Industry>("industries", { name: "text", description: "text" }));

export type CalibrationUnit = { id: string; name: string; taxCode: string; phone: string; fax: string; email: string; address: string; invoiceAddress: string };
export const calibrationUnitStore = createEntityStore<CalibrationUnit>(
  "calibration-units",
  [],
  columnsMapping<CalibrationUnit>("calibration_units", { name: "text", taxCode: "text", phone: "text", fax: "text", email: "text", address: "text", invoiceAddress: "text" }),
);

export type RequestPriority = { id: string; name: string; description: string; sort: number; surchargePct: number; isDefault: boolean };
export const requestPriorityStore = createEntityStore<RequestPriority>(
  "request-priorities",
  [],
  columnsMapping<RequestPriority>("request_priorities", { name: "text", description: "text", sort: "number", surchargePct: "number", isDefault: "bool" }),
);

export type LabInfo = {
  id: string;
  name: string;
  address: string;
  taxCode: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  director: string;
  head: string;
  vimcertNo: string;
  vilasNo: string;
};
export const labInfoStore = createEntityStore<LabInfo>(
  "lab-infos",
  [],
  columnsMapping<LabInfo>("lab_infos", {
    name: "text",
    address: "text",
    taxCode: "text",
    phone: "text",
    fax: "text",
    email: "text",
    website: "text",
    director: "text",
    head: "text",
    vimcertNo: "text",
    vilasNo: "text",
  }),
);

export type Standard = { id: string; name: string; description: string; englishDescription: string; sampleTypeId: string; docUrl: string; active: boolean };
export const standardStore = createEntityStore<Standard>(
  "standards",
  [],
  columnsMapping<Standard>("standards", { name: "text", description: "text", englishDescription: "text", sampleTypeId: "ref", docUrl: "text", active: "bool" }),
);

export type TestRecord = { id: string; name: string; description: string };
export const testRecordStore = createEntityStore<TestRecord>("test-records", [], columnsMapping<TestRecord>("test_records", { name: "text", description: "text" }));

export type TestRecordAnalyte = { id: string; recordId: string; analyteId: string; sort: number };
export const testRecordAnalyteStore = createEntityStore<TestRecordAnalyte>(
  "test-record-analytes",
  [],
  columnsMapping<TestRecordAnalyte>("test_record_analytes", { recordId: "ref", analyteId: "ref", sort: "number" }),
);

export type CustomerContract = {
  id: string;
  customerId: string;
  contractNo: string;
  value: number;
  signedAt: string;
  liquidatedAt: string;
  signerA: string;
  signerB: string;
  contractUrl: string;
  liquidationUrl: string;
  invoiceUrl: string;
  createdAt: string;
};
export const contractStore = createEntityStore<CustomerContract>(
  "customer-contracts",
  [],
  columnsMapping<CustomerContract>("customer_contracts", {
    customerId: "ref",
    contractNo: "text",
    value: "number",
    signedAt: "date",
    liquidatedAt: "date",
    signerA: "text",
    signerB: "text",
    contractUrl: "text",
    liquidationUrl: "text",
    invoiceUrl: "text",
    createdAt: "date",
  }),
);

export type LocationSchedule = { id: string; locationId: string; fieldDay: number | null; fieldMonth: number | null };
export const locationScheduleStore = createEntityStore<LocationSchedule>(
  "location-schedules",
  [],
  columnsMapping<LocationSchedule>("location_schedules", { locationId: "ref", fieldDay: "optnum", fieldMonth: "optnum" }),
);
