// Dữ liệu mẫu cho M2 (phòng thí nghiệm): điền các danh mục, khách hàng, đơn hàng, kết quả, kho, hồ sơ… đang trống
// để xem thử / trình diễn. Không sửa bản ghi có sẵn, chỉ thêm mới. Giới hạn quy chuẩn, đơn giá, định mức là SỐ GIẢ ĐỊNH
// (tên quy chuẩn / bảng giá ghi "số liệu mẫu"), không lấy từ văn bản chính thức.
// Mọi bản ghi tạo ra được ghi vào db/seed/m2-demo-ids.json → `npm run db:clean-demo` xóa sạch đúng những bản ghi đó.
// Chạy: npm run db:seed-demo  (chạy lại khi đã có dữ liệu mẫu sẽ dừng, cần dọn trước).
import { config } from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
config({ path: ".env.local", quiet: true });

const IDS_FILE = "db/seed/m2-demo-ids.json";
if (existsSync(IDS_FILE)) {
  console.error(`❌ Đã có dữ liệu mẫu (${IDS_FILE}). Chạy npm run db:clean-demo trước nếu muốn tạo lại.`);
  process.exit(1);
}

const { dbQuery } = await import("@/lib/platform/db");
const o = await import("@/lib/modules/m2/data/orders");
const ex = await import("@/lib/modules/m2/data/order-extras");
const cat = await import("@/lib/modules/m2/data/catalogs");
const set = await import("@/lib/modules/m2/data/settings");
const mg = await import("@/lib/modules/m2/data/manage");
const { supplierStore } = await import("@/lib/modules/m2/data/competence");
const { equipmentStore } = await import("@/lib/modules/m2/data/equipment");
const { chemicalsStore } = await import("@/lib/modules/m2/data/chemicals");
const { calibrationLogStore } = await import("@/lib/modules/m2/data/calibration-logs");
const { customerProfileStore } = await import("@/lib/modules/m2/data/customers");
const { assignmentStore } = await import("@/lib/modules/m2/data/custody");
const { insertResult, nextResultCode } = await import("@/lib/modules/m2/data/results");
const { issueReport } = await import("@/lib/modules/m2/data/reports");
const { allocateReportNo, reportNumberStore } = await import("@/lib/modules/m2/data/report-numbers");
const { staffStore } = await import("@/lib/modules/m2/data/staff");
const { toolUsageLogStore } = await import("@/lib/modules/m2/data/tool-usage-logs");
const { nextOrderCode, nextSampleCodes, nextBatchCode, orderTotals } = await import("@/lib/modules/m2/orders");

// ---- Ghi lại id để dọn ----
const ids: Record<string, string[]> = {};
const track = <T extends { id: string }>(table: string, item: T) => ((ids[table] ??= []).push(item.id), item);
const save = () => {
  mkdirSync("db/seed", { recursive: true });
  writeFileSync(IDS_FILE, JSON.stringify(ids, null, 1));
};
process.on("exit", save);

const TODAY = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const day = (offset: number) => new Date(Date.parse(`${TODAY}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);
const at = (offset: number, hour = 8) => `${day(offset)}T${String(hour).padStart(2, "0")}:00:00+07:00`;
const now = new Date().toISOString();

// ---- Dữ liệu có sẵn dùng để tham chiếu ----
const [types, analytes, staff, customers, equipment, chemicals] = await Promise.all([
  o.sampleTypeStore.list(),
  o.analyteStore.list(),
  staffStore.list(),
  customerProfileStore.list(),
  equipmentStore.list(),
  chemicalsStore.list(),
]);
const type = (name: string) => types.find((t) => t.name === name)!;
const staffName = (i: number) => staff[i % staff.length]?.fullName ?? "Kỹ thuật viên";
const cust = (name: string) => customers.find((c) => c.name === name) ?? customers[0];
const analytesOf = (typeName: string, n: number) => analytes.filter((a) => a.sampleTypeId === type(typeName).id && a.active).sort((a, b) => a.sort - b.sort).slice(0, n);

console.log("→ Danh mục Cài đặt");
const depts = await Promise.all(
  [["Phòng Phân tích", "PT"], ["Bộ phận Hiện trường", "HT"], ["Bộ phận Nhận mẫu", "NM"], ["Văn phòng", "VP"]].map(([name, code], i) => cat.departmentStore.create({ id: "", name, code, sort: i + 1 }).then((x) => track("departments", x))),
);
for (const [name, description] of [["Trồng trọt", "Sản xuất cây trồng, vùng trồng"], ["Sản xuất phân bón", "Cơ sở sản xuất, kinh doanh phân bón"], ["Chế biến nông sản", "Sơ chế, chế biến rau quả"], ["Chăn nuôi", "Trang trại chăn nuôi"]]) {
  track("industries", await cat.industryStore.create({ id: "", name, description }));
}
for (const [i, name] of ["Kế hoạch quan trắc", "Lấy mẫu", "Phân tích", "Công tác", "Họp"].entries()) {
  track("event_types", await cat.eventTypeStore.create({ id: "", name, description: "", sort: i + 1 }));
}
for (const [i, [name, pct]] of ([["Bình thường", 0], ["Gấp (trả trong 3 ngày)", 30], ["Rất gấp (trả trong 24 giờ)", 50]] as const).entries()) {
  track("request_priorities", await cat.requestPriorityStore.create({ id: "", name, description: "", sort: i + 1, surchargePct: pct, isDefault: i === 0 }));
}
for (const name of ["Trung tâm Kiểm định – Hiệu chuẩn Miền Bắc", "Công ty TNHH Hiệu chuẩn Đo lường Thanh Bình"]) {
  track("calibration_units", await cat.calibrationUnitStore.create({ id: "", name, taxCode: "", phone: "0237 3 852 000", fax: "", email: "", address: "Thanh Hóa", invoiceAddress: "" }));
}
const containers = [
  ["Chai nhựa PE 1 lít", "PE1", "chai", "Nước – chỉ tiêu lý hóa", "Chai nhựa"],
  ["Chai thủy tinh nâu 500 ml", "TT500", "chai", "Dư lượng BVTV, hữu cơ", "Chai thủy tinh"],
  ["Túi zip PE 1 kg", "ZIP1", "túi", "Đất, phân bón, nông sản", "Túi nhựa"],
  ["Chai PE 500 ml có HNO3", "PE500-KL", "chai", "Nước – kim loại", "Chai nhựa"],
];
for (const [name, symbol, unit, description, containerType] of containers) {
  track("sampling_containers", await cat.samplingContainerStore.create({ id: "", name, symbol, unit, description, containerType, lifetimeMonths: "12" }));
}
for (const [name, symbol, volume] of [["Chai nhựa", "CN", "500 ml – 1 l"], ["Chai thủy tinh", "CTT", "250 – 1000 ml"], ["Túi nhựa", "TN", "0,5 – 2 kg"]]) {
  track("container_types", await set.containerTypeStore.create({ id: "", name, symbol, volume, note: "", description: "" }));
}
for (const [name, sampleType, isField] of [["Bảo quản lạnh 2–5 °C", "Nước mặt", true], ["Axit hóa HNO3 đến pH < 2", "Nước mặt", true], ["Để khô tự nhiên trong bóng râm", "Đất", false], ["Bảo quản lạnh, phân tích trong 48 giờ", "Rau, quả", false]] as const) {
  track("preservations", await set.preservationStore.create({ id: "", name, description: "", sampleTypeId: type(sampleType).id, isField }));
}
for (const [name, code, unit] of [["Bình định mức 100 ml", "BDM100", "cái"], ["Pipet 10 ml", "PP10", "cái"], ["Cốc có mỏ 250 ml", "CCM250", "cái"], ["Giấy lọc định lượng", "GLDL", "hộp"]]) {
  track("lab_products", await cat.labProductStore.create({ id: "", name, code, unit, description: "", lifetimeMonths: "24" }));
}
track("lab_formulas", await cat.labFormulaStore.create({ id: "", name: "Quy đổi mẫu khô kiệt", formula: "KQ × 100 / (100 − W)", fieldVariables: "W: độ ẩm (%)", description: "Đất, phân bón" }));
track("lab_formulas", await cat.labFormulaStore.create({ id: "", name: "Hệ số pha loãng", formula: "KQ đo × Vđm / Vmẫu", fieldVariables: "Vđm, Vmẫu (ml)", description: "Nước" }));
track("lab_infos", await cat.labInfoStore.create({ id: "", name: "Viện Nông nghiệp Thanh Hóa", address: "Thanh Hóa", taxCode: "", phone: "", fax: "", email: "", website: "", director: "", head: "", vimcertNo: "", vilasNo: "VILAS 1501" }));

const instrumentTypes = [
  ["Máy quang phổ hấp thụ nguyên tử (AAS)", false],
  ["Hệ thống sắc ký khí khối phổ (GC-MS)", false],
  ["Máy quang phổ UV-Vis", false],
  ["Cân phân tích 4 số lẻ", false],
  ["Máy đo pH cầm tay", true],
  ["Máy đo oxy hòa tan (DO) cầm tay", true],
  ["Máy định vị GPS cầm tay", true],
] as const;
const itypes = [];
for (const [name, isField] of instrumentTypes) {
  itypes.push(track("instrument_types", await set.instrumentTypeStore.create({ id: "", name, note: "", description: "", unit: "chiếc", depreciationYears: "8", shiftsPerYear: 250, manualUrl: "", isField, departmentId: isField ? depts[1].id : depts[0].id })));
}
for (const [name, country] of [["Agilent", "Mỹ"], ["Shimadzu", "Nhật Bản"], ["Hach", "Mỹ"], ["Mettler Toledo", "Thụy Sĩ"], ["Memmert", "Đức"]]) {
  track("manufacturers", await set.manufacturerStore.create({ id: "", name, country, note: "" }));
}
const supplierRows = [
  ["Công ty TNHH Thiết bị Khoa học Hà Thành", "Thiết bị & hiệu chuẩn", "Thiết bị phân tích, phụ tùng"],
  ["Công ty CP Hóa chất Thí nghiệm Bắc Trung Bộ", "Hóa chất & chất chuẩn", "Hóa chất tinh khiết, chất chuẩn"],
  ["Công ty TNHH Vật tư Phòng thí nghiệm Lam Sơn", "Dụng cụ & vật tư", "Dụng cụ thủy tinh, vật tư tiêu hao"],
];
for (const [i, [name, category, provides]] of supplierRows.entries()) {
  track("suppliers", await supplierStore.create({
    id: "", code: `NCC-${String(i + 1).padStart(3, "0")}`, name, category: category as never, provides, contact: "", phone: "0237 3 7" + String(10000 + i * 137), accreditation: "", status: "Được phê duyệt",
    evaluatedAt: day(-120), result: "Đạt", nextEvaluationAt: day(245), criteria: "Chất lượng, thời gian giao hàng, giá", note: "", taxCode: "28010" + String(10000 + i), fax: "", email: "", address: "Thanh Hóa", invoiceAddress: "", active: true,
  }).catch(async () => (await supplierStore.list()).find((s) => s.name === name)!));
}
for (const [name, code] of [["Trung tâm Phân tích Môi trường Miền Trung", "TP-MT"], ["Phòng thí nghiệm Vi sinh Hà Nội", "TP-VS"]]) {
  track("subcontractors", await set.subcontractorStore.create({ id: "", name, code, phone: "", note: "", active: true, taxCode: "", fax: "", email: "", address: "", invoiceAddress: "", contact: "", asInternal: false }));
}

console.log("→ Quy chuẩn (số liệu mẫu), cột quy chuẩn, bảng giá, định mức");
const stdNm = track("standards", await cat.standardStore.create({ id: "", name: "QCVN 08:2023/BTNMT (số liệu mẫu)", description: "Chất lượng nước mặt – giới hạn trong phần mềm là số giả định để xem thử", englishDescription: "", sampleTypeId: type("Nước mặt").id, docUrl: "", active: true }));
const stdDat = track("standards", await cat.standardStore.create({ id: "", name: "QCVN 03:2023/BTNMT (số liệu mẫu)", description: "Chất lượng đất – giới hạn là số giả định để xem thử", englishDescription: "", sampleTypeId: type("Đất").id, docUrl: "", active: true }));
const mkSpec = (std: { id: string; name: string; sampleTypeId: string }, columnName: string) =>
  o.specificationStore.create({ id: "", name: std.name, columnName, sampleTypeId: std.sampleTypeId, note: "", active: true, printName: columnName, printNote: "", standardId: std.id, englishName: "" }).then((x) => track("specifications", x));
const specA = await mkSpec(stdNm, "Mức A");
const specB = await mkSpec(stdNm, "Mức B");
const specDat = await mkSpec(stdDat, "Đất nông nghiệp");
const limits = async (spec: { id: string }, typeName: string, factor: number) => {
  for (const [i, a] of analytesOf(typeName, 8).entries()) {
    const base = [10, 5, 10, 1, 200, 500, 6, 20][i] ?? 10;
    track("specification_limits", await o.specLimitStore.create({ id: "", specId: spec.id, analyte: a.name, minValue: null, maxValue: Math.round(base * factor * 100) / 100, note: "", notDetected: false, ndText: "", printNote: "", printText: "" }));
  }
};
await limits(specA, "Nước mặt", 1);
await limits(specB, "Nước mặt", 2);
await limits(specDat, "Đất", 10);

const priceList = track("rate_lists", await set.rateListStore.create({ id: "", kind: "price", name: "Bảng giá dịch vụ 2026 (số liệu mẫu)", note: "Đơn giá giả định để xem thử", active: true, costPrice: true }));
const priceOf = new Map<string, number>();
for (const tn of ["Đất", "Phân bón", "Nước mặt", "Nước dưới đất", "Rau, quả"]) {
  for (const [i, a] of analytesOf(tn, 10).entries()) {
    const amount = (tn === "Rau, quả" ? 900 : 120 + i * 25) * 1000;
    priceOf.set(`${tn}|${a.name}`, amount);
    track("rate_items", await set.rateItemStore.create({ id: "", listId: priceList.id, sampleTypeId: a.sampleTypeId, analyte: a.name, amount, cost: Math.round(amount * 0.55) }));
  }
}
const normList = track("rate_lists", await set.rateListStore.create({ id: "", kind: "norm", name: "Định mức kinh tế – kỹ thuật 2026 (số liệu mẫu)", note: "Định mức giả định để xem thử", active: true, costPrice: false }));
for (const a of analytesOf("Đất", 3)) {
  const item = track("rate_items", await set.rateItemStore.create({ id: "", listId: normList.id, sampleTypeId: a.sampleTypeId, analyte: a.name, amount: 0, cost: null }));
  await set.saveNormParts(item.id, [
    { category: "Dụng cụ lấy mẫu", name: "Túi zip PE 1 kg", quantity: 1, unitPrice: 3000 },
    { category: "Vật liệu PTN", name: chemicals[0]?.name ?? "Hóa chất", quantity: 0.02, unitPrice: 450000 },
    { category: "Thiết bị PTN", name: "Cân phân tích 4 số lẻ", quantity: 0.1, unitPrice: 60000 },
    { category: "Nhân công", name: "Kỹ thuật viên (công)", quantity: 0.5, unitPrice: 320000 },
  ]);
}

console.log("→ Template, biên bản, chỉ tiêu phụ, tài nguyên chỉ tiêu");
for (const [tn, name] of [["Đất", "Đất – dinh dưỡng cơ bản"], ["Nước mặt", "Nước mặt – kim loại nặng"]] as const) {
  track("bulk_templates", await set.bulkTemplateStore.create({ id: "", name, sampleTypeId: type(tn).id, description: "Bộ chỉ tiêu hay dùng", createdBy: "Dữ liệu mẫu", active: true, lines: analytesOf(tn, 5).map((a) => ({ name: a.name, unit: a.unit, method: a.method })) }));
}
track("batch_templates", await set.batchTemplateStore.create({ id: "", name: "Kim loại nặng – AAS", method: analytesOf("Nước mặt", 1)[0]?.method ?? "", analyst: staffName(1), instrumentCode: "Máy quang phổ hấp thụ nguyên tử (AAS)", chemicals: "Dung dịch chuẩn Pb 1000 mg/L; Axit nitric 65%", note: "", active: true }));
track("batch_templates", await set.batchTemplateStore.create({ id: "", name: "Dinh dưỡng đất – Kjeldahl", method: analytesOf("Đất", 4)[3]?.method ?? "", analyst: staffName(2), instrumentCode: "Cân phân tích 4 số lẻ", chemicals: "Axit sulfuric đặc", note: "", active: true }));
const rec = track("test_records", await cat.testRecordStore.create({ id: "", name: "Biên bản thử nghiệm đất", description: "Dùng cho mẫu đất" }));
for (const [i, a] of analytesOf("Đất", 4).entries()) track("test_record_analytes", await cat.testRecordAnalyteStore.create({ id: "", recordId: rec.id, analyteId: a.id, sort: i + 1 }));
const datA = analytesOf("Đất", 6);
if (datA.length >= 3) track("analyte_mappings", await set.analyteMappingStore.create({ id: "", sampleTypeId: type("Đất").id, mainAnalyteId: datA[1].id, method: "", accessoryIds: [datA[0].id], hideAccessory: false }));
for (const a of analytesOf("Nước mặt", 3)) {
  track("analyte_resources", await set.analyteResourceStore.create({ id: "", analyteId: a.id, kind: "container", name: "Chai PE 500 ml có HNO3", isDefault: true }));
  track("analyte_resources", await set.analyteResourceStore.create({ id: "", analyteId: a.id, kind: "preservation", name: "Axit hóa HNO3 đến pH < 2", isDefault: true }));
  track("analyte_resources", await set.analyteResourceStore.create({ id: "", analyteId: a.id, kind: "instrument_lab", name: "Máy quang phổ hấp thụ nguyên tử (AAS)", isDefault: true }));
}

console.log("→ Khách hàng: liên lạc, địa điểm, vị trí, lịch, hợp đồng");
const people = [["Ông", "Nguyễn Văn Thành", "Giám đốc"], ["Bà", "Lê Thị Hoa", "Kế toán"], ["Ông", "Trịnh Đình Nam", "Cán bộ kỹ thuật"], ["Bà", "Phạm Thị Lan", "Trưởng phòng"]];
const locs: Record<string, string> = {};
for (const [i, c] of customers.slice(0, 6).entries()) {
  const [salutation, name, title] = people[i % people.length];
  track("customer_contacts", await ex.contactStore.create({ id: "", customerId: c.id, name, title, phone: `09${String(12345670 + i * 1111).slice(0, 8)}`, email: "", note: "", salutation, department: "", phone2: "" }));
  const loc = track("customer_locations", await ex.locationStore.create({ id: "", customerId: c.id, name: `Khu sản xuất ${c.name.split(" ").slice(-2).join(" ")}`, oldName: "", description: "", englishName: "" }));
  locs[c.id] = loc.id;
  for (let k = 1; k <= 2; k++) {
    track("monitoring_points", await ex.pointStore.create({ id: "", locationId: loc.id, name: `Vị trí ${k}`, description: k === 1 ? "Đầu khu vực" : "Cuối khu vực", lat: 19.8 + i * 0.05 + k * 0.003, lng: 105.6 + i * 0.04 + k * 0.004, englishName: "", sort: k, active: true }));
  }
  track("location_schedules", await cat.locationScheduleStore.create({ id: "", locationId: loc.id, fieldDay: 15, fieldMonth: (i % 12) + 1 }));
  if (i < 3) track("customer_contracts", await cat.contractStore.create({ id: "", customerId: c.id, contractNo: `HĐ-${String(i + 12).padStart(3, "0")}/2026/VNN`, value: (i + 1) * 18_500_000, signedAt: day(-90 + i * 20), liquidatedAt: "", signerA: name, signerB: "Viện Nông nghiệp Thanh Hóa", contractUrl: "", liquidationUrl: "", invoiceUrl: "", createdAt: now }));
}

console.log("→ Đơn hàng, yêu cầu, kết quả");
type Plan = { customer: string; name: string; kind: string; status: string; field: number; due: number; samples: [string, string, number][]; stage: "done" | "approved" | "partial" | "qa" | "field" | "quote" };
const plans: Plan[] = [
  { customer: "HTX Cam Vân Du", name: "Phân tích đất vùng trồng cam đợt 3", kind: "Quan trắc", status: "Thanh lý", field: -70, due: -55, samples: [["Đất", "Vườn cam lô A", 3], ["Đất", "Vườn cam lô B", 2]], stage: "done" },
  { customer: "Công ty CP Phân bón Tiến Nông", name: "Kiểm tra chất lượng phân bón NPK lô 09/2026", kind: "Mẫu gửi", status: "Trả kết quả", field: -40, due: -25, samples: [["Phân bón", "NPK 16-16-8 lô 09", 2]], stage: "done" },
  { customer: "Phòng NN&PTNT huyện Thọ Xuân", name: "Quan trắc nước mặt kênh Bắc quý IV", kind: "Quan trắc", status: "Phân tích", field: -15, due: 6, samples: [["Nước mặt", "Kênh Bắc – cống số 3", 2], ["Nước mặt", "Kênh Bắc – cầu Xuân Lai", 2]], stage: "partial" },
  { customer: "Trang trại Rau an toàn Yên Định", name: "Dư lượng thuốc BVTV trên rau cải", kind: "Mẫu gửi", status: "Phân tích", field: -6, due: 4, samples: [["Rau, quả", "Rau cải ngọt luống 2", 1], ["Rau, quả", "Rau cải ngọt luống 5", 1]], stage: "qa" },
  { customer: "HTX Nông nghiệp Sông Mã", name: "Quan trắc đất trồng lúa vụ Đông", kind: "Quan trắc", status: "Quan trắc", field: 3, due: 20, samples: [["Đất", "Cánh đồng mẫu lớn xã Hà Long", 2]], stage: "field" },
  { customer: "Hộ ông Lê Bá Khánh", name: "Phân tích nước giếng khoan sinh hoạt", kind: "Mẫu gửi", status: "Báo giá", field: 8, due: 22, samples: [["Nước dưới đất", "Giếng khoan hộ gia đình", 1]], stage: "quote" },
  { customer: "Công ty CP Phân bón Tiến Nông", name: "Phân hữu cơ vi sinh lô thử nghiệm", kind: "Mẫu gửi", status: "Báo giá", field: 12, due: 30, samples: [["Phân bón", "Phân hữu cơ vi sinh HC-02", 1]], stage: "quote" },
  { customer: "Phòng NN&PTNT huyện Thọ Xuân", name: "Quan trắc nước dưới đất các giếng quan trắc", kind: "Quan trắc", status: "Quan trắc", field: -4, due: 14, samples: [["Nước dưới đất", "Giếng QT-01", 1], ["Nước dưới đất", "Giếng QT-02", 1]], stage: "field" },
];

const existingCodes = (await o.orderStore.list()).map((x) => x.code);
const allSampleCodes = new Set((await dbQuery(`select code from public.samples`)).map((r) => r.code as string));
const year = Number(TODAY.slice(0, 4));
const approvals = (level: number, tech: string) =>
  (["KTV nhập", "QA/QC kiểm tra", "Trưởng phòng duyệt"] as const).map((step, i) =>
    i < level
      ? { step, actor: i === 0 ? tech : i === 1 ? staffName(0) : "Trưởng phòng PTN", role: i === 0 ? "NV phân tích" : "Quản lý", decision: "Đạt", signedAt: `${day(-3 + i)} ${String(9 + i).padStart(2, "0")}:00` }
      : { step, actor: "—", role: "—", decision: "Chờ" },
  );
const statusOf = (level: number) => (level >= 3 ? "Đã duyệt" : level === 2 ? "Chờ Trưởng phòng" : level === 1 ? "Chờ QA/QC" : "Đang nhập");
const createdOrders: { order: Awaited<ReturnType<typeof o.orderStore.create>>; plan: Plan; samples: { code: string; type: string; id: string }[]; lineIds: string[] }[] = [];

for (const [n, p] of plans.entries()) {
  const c = cust(p.customer);
  const code = nextOrderCode(year, [...existingCodes, ...createdOrders.map((x) => x.order.code)]);
  const lines = p.samples.flatMap(([tn, , count]) => Array.from({ length: count }, () => analytesOf(tn, tn === "Rau, quả" ? 1 : 5)).flat().map((a) => ({ tn, a })));
  const amount = lines.reduce((s, l) => s + (priceOf.get(`${l.tn}|${l.a.name}`) ?? 150_000), 0);
  const order = track("orders", await o.orderStore.create({
    id: "", code, name: p.name, kind: p.kind, customerId: c.id, contact: people[n % people.length][1], location: "", contractNo: "", requestingUnit: "",
    fieldAt: at(p.field), receivedAt: p.stage === "quote" || p.stage === "field" ? "" : at(p.field + 1, 9), dueAt: at(p.due, 17), internalDueAt: at(p.due - 2, 17),
    deliveredAt: p.stage === "done" ? at(p.due - 1, 15) : "", disposeAt: "", salesStaff: staffName(5), fieldStaff: staffName(3), signer: "Trưởng phòng PTN", qaStaff: staffName(0),
    deliveryMethod: "Trực tiếp", reportNo: "", status: p.status, note: "", createdBy: "Dữ liệu mẫu", createdAt: at(p.field - 10), quoteNo: `${code}/BG.1`, quotedAt: day(p.field - 9),
    amount, discountPct: n % 3 === 0 ? 5 : 0, vatRate: 8, priceListId: priceList.id, contactId: "", locationId: locs[c.id] ?? "", contractId: "", requestingUnitId: "", compareOrderIds: [],
    growingAreaCode: "", packingFacilityCode: "", vehiclePlate: "", trailerPlate: "", containerNo: "", sealNo: "", showFieldTime: false, hideRequests: false, activityReport: false,
    industryId: "", departmentId: depts[0].id, deliveryCount: "", reportNoEn: "", reportNoKind: "",
  }));
  const rec = { order, plan: p, samples: [] as { code: string; type: string; id: string }[], lineIds: [] as string[] };
  createdOrders.push(rec);
  // Báo giá
  const t = orderTotals(amount, order.discountPct, order.vatRate);
  track("order_quotes", await ex.orderQuoteStore.create({
    id: "", orderId: order.id, kind: p.stage === "quote" ? "before" : "after", code: `${code}/BG.1`, quotedAt: day(p.field - 9), discountPct: order.discountPct, vatRate: 8, managementFeePct: 0, note: "",
    lines: lines.map((l) => ({ label: l.a.name, unit: "mẫu", quantity: 1, unitPrice: priceOf.get(`${l.tn}|${l.a.name}`) ?? 150_000, group: l.tn })), total: t.total, createdBy: "Dữ liệu mẫu", createdAt: at(p.field - 9),
  }));
  if (p.stage === "quote") continue;
  // Thanh toán
  if (p.stage === "done") track("order_payments", await o.orderPaymentStore.create({ id: "", orderId: order.id, amount: t.total, paidAt: day(p.due), method: "Chuyển khoản", note: "Thanh toán đủ", createdBy: "Dữ liệu mẫu" }));
  if (p.stage === "partial") track("order_payments", await o.orderPaymentStore.create({ id: "", orderId: order.id, amount: Math.round(t.total / 2), paidAt: day(p.field - 5), method: "Chuyển khoản", note: "Tạm ứng 50%", createdBy: "Dữ liệu mẫu" }));
  // Kế hoạch quan trắc
  if (p.kind === "Quan trắc") {
    track("order_plans", await ex.orderPlanStore.create({ id: "", orderId: order.id, leader: staffName(3), supervisor: staffName(0), deputy1: staffName(4), deputy2: "", groups: [[staffName(3), staffName(4)]], startAt: day(p.field), endAt: day(p.field), vehicle: "Xe 36A-123.45", note: "", updatedBy: "Dữ liệu mẫu", updatedAt: now }));
    for (const [k, [kind, name, quantity]] of [["Thiết bị", "Máy đo pH cầm tay", "1"], ["Thiết bị", "Máy định vị GPS cầm tay", "1"], ["Vật tư – hóa chất", "Túi zip PE 1 kg", "10"], ["Bảo quản", "Thùng đá giữ lạnh", "1"]].entries()) {
      track("order_plan_items", await ex.planItemStore.create({ id: "", orderId: order.id, kind, name, quantity, note: "", sort: k + 1 }));
    }
  }
  // Yêu cầu (mẫu) + dòng kết quả
  const fieldDay = day(p.field);
  for (const [tn, locName, count] of p.samples) {
    const st = type(tn);
    const codes = nextSampleCodes(st.prefix, fieldDay, [...allSampleCodes], count);
    for (const [k, sc] of codes.entries()) {
      allSampleCodes.add(sc);
      const stage = p.stage === "done" ? "Trả kết quả" : p.stage === "field" ? "Đợi lấy mẫu" : "Phân tích";
      const sample = track("samples", await o.orderSampleStore.create({
        id: "", code: sc, customerId: c.id, customer: c.name, type: tn, receivedAt: p.stage === "field" ? "" : day(p.field + 1), dueAt: day(p.due), status: "Đã tiếp nhận", criteria: [], orderId: order.id,
        sampleTypeId: st.id, locationName: count > 1 ? `${locName} #${k + 1}` : locName, customerSampleCode: "", isQc: false, isDuplicate: false, sampledAt: p.stage === "field" ? "" : at(p.field, 9),
        stage, specId: tn === "Nước mặt" ? specA.id : tn === "Đất" ? specDat.id : "", spec2Id: tn === "Nước mặt" ? specB.id : "", pointId: "", disposeAt: "", sampler: staffName(3),
        sampleCondition: "Nguyên vẹn", sampleQuantity: tn === "Nước mặt" || tn === "Nước dưới đất" ? "2 lít" : "1 kg", lat: null, lng: null, envConditions: {},
      }));
      rec.samples.push({ code: sc, type: tn, id: sample.id });
      const list = analytesOf(tn, tn === "Rau, quả" ? 1 : 5);
      for (const [j, a] of list.entries()) {
        const level = p.stage === "done" ? 3 : p.stage === "partial" ? (j < 3 ? 3 : 1) : p.stage === "qa" ? 1 : 0;
        const tech = staffName(1 + (j % 3));
        const mean = p.stage === "field" ? null : Math.round((0.5 + ((j * 7 + k * 3) % 11)) * (tn.startsWith("Nước") ? 0.8 : 1.6) * 100) / 100;
        const r = await insertResult({
          result_code: await nextResultCode(String(year)), sample_code: sc, customer_name: c.name, matrix: tn, criterion: a.name, unit: a.unit, method: a.method, subcontractor: "",
          sort: j + 1, sampling_times: 1, line_kind: "Phòng TN", status: statusOf(level), approvals: approvals(level, tech), replicates: mean == null ? [] : [String(mean).replace(".", ",")],
          raw_files: [], conclusion: "Báo cáo giá trị", mean, technician: tech, analyst: tech, started_at: mean == null ? null : day(p.field + 2), finished_at: level >= 1 ? day(p.field + 4) : null,
        });
        track("analysis_results", r);
        rec.lineIds.push(r.id);
      }
      await dbQuery(`update public.samples set criteria = $2::jsonb where id = $1`, [sample.id, JSON.stringify(list.map((a) => a.name))]);
    }
  }
  // Quy chuẩn theo loại mẫu của đơn
  for (const tn of [...new Set(p.samples.map((s) => s[0]))]) {
    if (tn === "Nước mặt") track("order_type_specs", await ex.orderTypeSpecStore.create({ id: "", orderId: order.id, sampleTypeId: type(tn).id, spec1Id: specA.id, spec2Id: specB.id, standardIds: [stdNm.id], specIds: [specA.id, specB.id] }));
    if (tn === "Đất") track("order_type_specs", await ex.orderTypeSpecStore.create({ id: "", orderId: order.id, sampleTypeId: type(tn).id, spec1Id: specDat.id, spec2Id: "", standardIds: [stdDat.id], specIds: [specDat.id] }));
  }
  // Bảo quản theo mẫu (nước)
  const pres = (await set.preservationStore.list()).find((x) => x.name.startsWith("Bảo quản lạnh 2"));
  for (const s of rec.samples.filter((x) => x.type.startsWith("Nước"))) {
    if (pres) track("sample_preservations", await ex.samplePreservationStore.create({ id: "", sampleId: s.id, preservationId: pres.id }));
  }
}

console.log("→ Mẻ thử nghiệm, số phiếu, phiếu kết quả");
const batchCodes: string[] = (await o.testBatchStore.list()).map((b) => b.code);
for (const [i, rec] of createdOrders.filter((x) => x.plan.stage === "partial" || x.plan.stage === "qa").entries()) {
  const code = nextBatchCode(day(-3), batchCodes);
  batchCodes.push(code);
  const b = track("test_batches", await o.testBatchStore.create({ id: "", code, method: "", analyst: staffName(1 + i), instrumentCode: i ? "Hệ thống sắc ký khí khối phổ (GC-MS)" : "Máy quang phổ hấp thụ nguyên tử (AAS)", chemicals: "", startedAt: day(-3), finishedAt: "", status: "Đang thực hiện", note: "", createdBy: "Dữ liệu mẫu", createdAt: now }));
  await o.setLinesBatch(rec.lineIds, b.id);
}
for (const rec of createdOrders.filter((x) => x.plan.stage === "done")) {
  const { item } = await allocateReportNo(rec.order.id, "VILAS", 1, "Dữ liệu mẫu");
  track("report_numbers", item);
  for (const s of rec.samples) {
    const res = await issueReport(s.code, { name: "Trưởng phòng PTN", email: "", roles: ["Quản lý"] }, "");
    if ("report" in res && res.report) track("test_reports", res.report);
    else console.warn(`  ! Không phát hành được phiếu ${s.code}: ${"error" in res ? res.error : ""}`);
  }
}
void reportNumberStore;

console.log("→ Trang chủ, lịch công tác, phân công");
for (const [i, body] of ["Tuần này ưu tiên trả kết quả đơn quan trắc nước mặt kênh Bắc trước thứ Sáu.", "Đã nhận lô chuẩn Pb 1000 mg/L mới, mọi người dùng lô mới từ hôm nay.", "Lịch hiệu chuẩn cân phân tích vào sáng thứ Tư, tạm dừng cân từ 8h–10h."].entries()) {
  track("lab_posts", await o.labPostStore.create({ id: "", author: staffName(i === 0 ? 0 : i + 1), body, createdAt: new Date(Date.now() - (i + 1) * 5 * 3600_000).toISOString() }));
}
const wk = [
  [0, 0, "Phân tích", "Kiểm tra kết quả kim loại nặng nước mặt", "8h00 – 11h30", 3.5],
  [1, 0, "Phân tích", "Phân tích Pb, Cd mẻ AAS", "8h00 – 17h00", 8],
  [2, 1, "Phân tích", "Xử lý mẫu rau cải – GC-MS", "8h00 – 17h00", 8],
  [3, 3, "Lấy mẫu", "Lấy mẫu đất Hà Long (Sông Mã)", "6h30 – 16h00", 8],
  [4, 3, "Lấy mẫu", "Lấy mẫu đất Hà Long (Sông Mã)", "6h30 – 16h00", 8],
  [5, 2, "Họp", "Họp giao ban phòng thí nghiệm", "14h00 – 15h30", 1.5],
  [0, 4, "Công tác", "Đánh giá nội bộ ISO/IEC 17025", "8h00 – 17h00", 8],
] as const;
for (const [s, d, kind, title, workTime, hours] of wk) {
  track("work_schedule", await o.workScheduleStore.create({ id: "", staffName: staffName(s), day: day(d), kind, title, hours, orderId: "", note: "", createdBy: "Dữ liệu mẫu", workTime }));
}
const pending = createdOrders.find((x) => x.plan.stage === "qa");
for (const [i, s] of (pending?.samples ?? []).entries()) {
  track("assignments", await assignmentStore.create({ id: "", sampleCode: s.code, testLabel: `${analytesOf("Rau, quả", 1)[0]?.name ?? "Chỉ tiêu"} · ${s.type}`, assignee: staffName(2 + i), assignedBy: staffName(0), assignedAt: at(-5), dueAt: day(3), status: "Đang làm", note: "" }));
}

console.log("→ Thiết bị: hiệu chuẩn, nhập / xuất kho");
const calUnits = await cat.calibrationUnitStore.list();
for (const [i, e] of equipment.slice(0, 8).entries()) {
  const periodic = day(-300 + i * 40);
  track("calibration_logs", await calibrationLogStore.create({
    id: "", equipmentId: e.id, equipmentCode: e.code, equipmentName: e.name, date: periodic, internalDate: day(-30 + i * 3), internalBy: staffName(1 + (i % 3)), place: calUnits[i % calUnits.length]?.name ?? "",
    certificate: `GCN-${2026}-${String(310 + i).padStart(4, "0")}`, condition: "Tốt", note: "", result: "Đạt", nextDate: day(65 + i * 40), technician: staffName(1 + (i % 3)),
  }));
}
const fieldEq = equipment.filter((e) => e.isField).slice(0, 2);
const outEq = (fieldEq.length ? fieldEq : equipment.slice(8, 10)).map((e) => e.id);
const fieldOrder = createdOrders.find((x) => x.plan.stage === "field");
const mvIn = track("instrument_moves", await mg.instrumentMoveStore.create({ id: "", kind: "nhap", movedAt: day(-60), orderId: "", deliverer: supplierRows[0][0], receiver: staffName(0), note: "Nhận thiết bị sau hiệu chuẩn", createdAt: now }));
await mg.setMoveItems(mvIn.id, equipment.slice(0, 2).map((e) => e.id));
const mvOut = track("instrument_moves", await mg.instrumentMoveStore.create({ id: "", kind: "xuat", movedAt: day(-1), orderId: fieldOrder?.order.id ?? "", deliverer: staffName(0), receiver: staffName(3), note: "Mang ra hiện trường", createdAt: now }));
await mg.setMoveItems(mvOut.id, outEq);

console.log("→ Hóa chất: lô nhập, xuất kho");
const chems = chemicals.slice(0, 6);
const lot1 = track("chemical_imports", await mg.chemicalImportStore.create({ id: "", name: "Lô 01/2026", importedAt: day(-150), deliverer: supplierRows[1][0], receiver: staffName(0), note: "", createdAt: now }));
await mg.saveImportItems(lot1.id, chems.slice(0, 4).map((c, i) => ({ chemicalId: c.id, qty: [5, 10, 2, 1][i], expiry: [day(400), day(20), day(-10), day(600)][i] })));
const lot2 = track("chemical_imports", await mg.chemicalImportStore.create({ id: "", name: "Lô 07/2026", importedAt: day(-40), deliverer: supplierRows[1][0], receiver: staffName(1), note: "", createdAt: now }));
await mg.saveImportItems(lot2.id, chems.slice(3, 6).map((c, i) => ({ chemicalId: c.id, qty: [4, 6, 3][i], expiry: day(500 + i * 30) })));
const lotRows = (await mg.chemicalLots()).filter((l) => l.importId === lot1.id || l.importId === lot2.id);
const exp1 = track("chemical_exports", await mg.chemicalExportStore.create({ id: "", exportedAt: day(-20), deliverer: staffName(0), receiver: staffName(1), note: "", createdAt: now }));
await mg.saveExportItems(exp1.id, lotRows.slice(0, 3).map((l, i) => ({ importItemId: l.id, qty: Math.min(l.remaining, [2, 9.5, 0.5][i]), purpose: ["Phân tích kim loại nặng", "Phân tích dinh dưỡng đất", "Pha dung dịch chuẩn"][i] })));

console.log("→ Hồ sơ, vật tư");
const docs = [
  ["15/2026/QĐ-VNN", -200, "Viện Nông nghiệp Thanh Hóa", "Quyết định ban hành Sổ tay chất lượng phòng thí nghiệm (lần 3)"],
  ["102/TB-VPCNCL", -150, "Văn phòng Công nhận Chất lượng", "Thông báo kế hoạch đánh giá giám sát VILAS 1501"],
  ["28/2026/KH-PTN", -60, "Phòng thí nghiệm", "Kế hoạch đào tạo và đánh giá tay nghề kỹ thuật viên năm 2026"],
  ["09/2026/QĐ-VNN", -20, "Viện Nông nghiệp Thanh Hóa", "Quyết định phân công nhiệm vụ ký phiếu kết quả thử nghiệm"],
] as const;
for (const [i, [number, d, issuer, summary]] of docs.entries()) {
  track("van_bans", await mg.vanBanStore.create({ id: "", number, issuedAt: day(d), issuer, summary, note: "", assignees: [staffName(i), staffName(i + 2)], active: true, fileName: "", fileType: "" }));
}
for (const [i, [itemName, qty, status]] of ([["Đầu tip 1000 µl", 2, "Đã sử dụng"], ["Giấy lọc định lượng", 1, "Đã sử dụng"], ["Găng tay nitrile", 3, "Đã sử dụng"]] as const).entries()) {
  track("tool_usage_logs", await toolUsageLogStore.create({ id: "", itemName, qty, unit: "hộp", importedAt: day(-10 + i * 3), status, user: staffName(1 + i), note: "" }));
}

save();
console.log(`✅ Xong: ${Object.values(ids).reduce((s, x) => s + x.length, 0)} bản ghi mẫu, danh sách id ở ${IDS_FILE}`);
process.exit(0);
