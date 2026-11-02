// Khai báo các danh mục Cài đặt dạng XaLab: trang danh sách /<slug>, trang Thêm /<slug>/new, trang Sửa /<slug>/<id>.
// Mỗi danh mục: kho dữ liệu, trường form (đúng thứ tự form XaLab), cột danh sách, giá trị mặc định khi tạo.
import type { EntityStore } from "@/lib/platform/data/factory";
import { sampleTypeStore } from "@/lib/modules/m2/data/orders";
import {
  analyteGroupStore,
  containerTypeStore,
  instrumentTypeStore,
  labMethodStore,
  manufacturerStore,
  preservationStore,
  subcontractorStore,
} from "@/lib/modules/m2/data/settings";
import {
  calibrationUnitStore,
  departmentStore,
  eventTypeStore,
  industryStore,
  labFormulaStore,
  labInfoStore,
  labProductStore,
  requestPriorityStore,
  samplingContainerStore,
  standardStore,
  testRecordStore,
} from "@/lib/modules/m2/data/catalogs";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";
import { supplierStore } from "@/lib/modules/m2/data/competence";
import { EQUIPMENT_CONDITIONS, nextChemicalCode, nextSupplierCode, chemicalInUse, equipmentInUse } from "@/lib/modules/m2/data/manage";

export type Opt = { value: string; label: string };
export type XFieldType = "text" | "number" | "date" | "textarea" | "select" | "checkbox" | "url";
export type XField = {
  name: string;
  label: string;
  type?: XFieldType;
  /** Lựa chọn của ô chọn: cố định hoặc nạp từ danh mục khác. */
  options?: Opt[] | (() => Promise<Opt[]>);
  /** Dòng trống đầu ô chọn. */
  empty?: string;
  required?: boolean;
  placeholder?: string;
  /** Ô số để trống → null. */
  nullable?: boolean;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mỗi danh mục một kiểu bản ghi
type Row = Record<string, any>;
export type XColumn = { label: string; get: (r: Row) => string | number };

export type CatalogDef = {
  slug: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- kho của từng danh mục có kiểu riêng
  store: EntityStore<any>;
  /** "Danh sách …" */
  listTitle: string;
  /** Tiêu đề trang thêm (mặc định "Tạo mới"). */
  newTitle?: string;
  /** Tiêu đề trang sửa (mặc định "Sửa bản ghi"). */
  editTitle?: (r: Row) => string;
  /** Dòng phụ dưới tiêu đề form (VD "Thông tin thầu phụ"). */
  formSubtitle?: string;
  searchPlaceholder?: string;
  /** Cột "#" (số thứ tự) như một số danh sách XaLab. */
  showIndex?: boolean;
  fields: XField[];
  defaults: Row;
  /** Cột đầu tiên là link sang trang sửa. */
  columns: XColumn[];
  search?: (r: Row) => string;
  sort?: (a: Row, b: Row) => number;
  /** Lọc bản ghi thuộc danh mục (VD nhóm chỉ tiêu Môi trường lao động). */
  filter?: (r: Row) => boolean;
  /** Trường "đang dùng" cho bộ lọc Trạng thái. */
  activeKey?: string;
  validate?: (b: Row) => string | null;
  /** Link thêm ở cuối dòng (VD "Bảng giá", "Chỉ tiêu"). */
  rowLinks?: (r: Row) => { label: string; href: string }[];
  /** Giá trị tự sinh khi thêm mới (VD mã hóa chất). */
  prepare?: () => Promise<Row>;
  /** Lý do không được xóa (đã dùng ở nơi khác), null = cho xóa. */
  beforeDelete?: (id: string) => Promise<string | null>;
};

const byName = (a: Row, b: Row) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "vi");
const bySort = (a: Row, b: Row) => (Number(a.sort) || 0) - (Number(b.sort) || 0) || byName(a, b);
const needName = (label = "tên") => (b: Row) => (!String(b.name ?? "").trim() ? `Nhập ${label}` : null);
const opts = (xs: readonly string[]): Opt[] => xs.map((x) => ({ value: x, label: x }));

/** Mẫu biên bản lấy mẫu / thử nghiệm in theo loại mẫu (như XaLab). */
export const RECORD_TEMPLATES = ["Đất thải, bùn thải", "Khí thải", "Không khí xung quanh", "Không khí môi trường lao động", "Nước", "Nông sản – thực phẩm", "Phân bón"] as const;

const staffOpts = async (): Promise<Opt[]> => (await staffStore.list()).map((s) => s.fullName).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi")).map((n) => ({ value: n, label: n }));
const sampleTypeOpts = async (): Promise<Opt[]> => (await sampleTypeStore.list()).filter((t) => t.active).sort(bySort).map((t) => ({ value: t.id, label: t.name }));
const containerTypeOpts = async (): Promise<Opt[]> => (await containerTypeStore.list()).sort(byName).map((t) => ({ value: t.name, label: t.name }));
const departmentOpts = async (): Promise<Opt[]> => (await departmentStore.list()).sort(bySort).map((d) => ({ value: d.id, label: d.name }));

/** Ô nhãn liên hệ dùng chung (cơ quan, nhà cung cấp, đơn vị hiệu chuẩn). */
const orgFields = (nameLabel: string): XField[] => [
  { name: "name", label: nameLabel, required: true },
  { name: "taxCode", label: "Mã số thuế" },
  { name: "phone", label: "Số điện thoại" },
  { name: "fax", label: "Fax" },
  { name: "email", label: "Email" },
  { name: "address", label: "Địa chỉ" },
  { name: "invoiceAddress", label: "Địa chỉ hóa đơn" },
];

const instrumentTypeOpts = async (): Promise<Opt[]> => (await instrumentTypeStore.list()).sort(byName).map((t) => ({ value: t.id, label: t.name }));
const manufacturerOpts = async (): Promise<Opt[]> => (await manufacturerStore.list()).sort(byName).map((t) => ({ value: t.id, label: t.name }));
const supplierOpts = async (): Promise<Opt[]> => (await supplierStore.list()).sort(byName).map((t) => ({ value: t.id, label: t.name }));

export const CATALOGS: CatalogDef[] = [
  {
    slug: "equipment",
    store: equipmentStore,
    listTitle: "Danh sách mã thiết bị",
    formSubtitle: "Thông tin loại thiết bị phân tích/quan trắc",
    searchPlaceholder: "Tên thiết bị...",
    fields: [
      { name: "code", label: "Mã thiết bị", required: true },
      { name: "name", label: "Tên thiết bị", required: true },
      { name: "instrumentTypeId", label: "Thiết bị", type: "select", options: instrumentTypeOpts, empty: "" },
      { name: "manufacturerId", label: "Nhà sản xuất", type: "select", options: manufacturerOpts, empty: "" },
      { name: "yearMade", label: "Năm sản xuất", type: "number", nullable: true },
      { name: "serial", label: "Số seri" },
      { name: "supplierId", label: "Nhà cung cấp", type: "select", options: supplierOpts, empty: "" },
      { name: "commissionedAt", label: "Thời gian bắt đầu sử dụng", type: "date" },
      { name: "lastCalibration", label: "Hiệu chuẩn định kỳ gần nhất", type: "date" },
      { name: "calibrationDays", label: "Tần suất hiệu chuẩn (ngày/lần)", type: "number", nullable: true },
      { name: "condition", label: "Tình trạng hoạt động", type: "select", options: opts(EQUIPMENT_CONDITIONS) },
      { name: "qualityLevel", label: "Cấp quản lý chất lượng" },
      { name: "managementSystem", label: "Hệ thống quản lý", type: "select", options: opts(["ISO/IEC 17025", "VILAS", "VIMCERTS"]), empty: "Tất cả" },
      { name: "active", label: "Đang dùng", type: "checkbox" },
    ],
    defaults: {
      code: "", name: "", model: "", location: "", lastCalibration: "", nextCalibration: "", status: "Hoạt động", usageHours: 0,
      instrumentTypeId: "", manufacturerId: "", supplierId: "", yearMade: null, calibrationDays: null, condition: "Không rõ", qualityLevel: "", managementSystem: "", active: true,
    },
    columns: [
      { label: "Mã thiết bị", get: (r) => r.code },
      { label: "Tên", get: (r) => r.name },
      { label: "Tình trạng hoạt động", get: (r) => r.condition || "Không rõ" },
    ],
    search: (r) => `${r.code} ${r.name} ${r.serial ?? ""}`,
    sort: (a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }),
    activeKey: "active",
    validate: (b) => (!String(b.code ?? "").trim() ? "Nhập mã thiết bị" : !String(b.name ?? "").trim() ? "Nhập tên thiết bị" : null),
    beforeDelete: equipmentInUse,
  },
  {
    slug: "suppliers",
    store: supplierStore,
    listTitle: "Danh sách nhà cung cấp",
    formSubtitle: "Thông tin nhà cung cấp",
    searchPlaceholder: "Tên nhà cung cấp...",
    fields: [...orgFields("Tên nhà cung cấp"), { name: "active", label: "Đang dùng", type: "checkbox" }],
    defaults: {
      code: "", name: "", category: "Hóa chất & chất chuẩn", provides: "", contact: "", phone: "", accreditation: "", status: "Đang đánh giá", evaluatedAt: "", result: "",
      nextEvaluationAt: "", criteria: "", note: "", taxCode: "", fax: "", email: "", address: "", invoiceAddress: "", active: true,
    },
    columns: [{ label: "Tên nhà cung cấp", get: (r) => r.name }],
    activeKey: "active",
    prepare: async () => ({ code: await nextSupplierCode() }),
    validate: needName("tên nhà cung cấp"),
  },
  {
    slug: "chemicals",
    store: chemicalsStore,
    listTitle: "Danh sách hoá chất",
    formSubtitle: "Thông tin hoá chất",
    searchPlaceholder: "Tên hoá chất...",
    showIndex: true,
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "unit", label: "Đơn vị" },
      { name: "technicalSpec", label: "Mô tả" },
    ],
    defaults: { code: "", name: "", cas: "—", unit: "", stock: 0, minStock: 0, expiry: "", hazard: "Thường", location: "", technicalSpec: "", manufacturer: "", manufactureDate: "", receivedAt: "", storageCondition: "", usedFor: [] },
    columns: [
      { label: "Tên", get: (r) => r.name },
      { label: "Đơn vị", get: (r) => r.unit },
    ],
    prepare: async () => ({ code: await nextChemicalCode() }),
    beforeDelete: chemicalInUse,
    validate: needName("tên hoá chất"),
  },
  {
    slug: "lab-methods",
    store: labMethodStore,
    listTitle: "Danh sách phương pháp phân tích",
    editTitle: (r) => r.name,
    searchPlaceholder: "Tên phương pháp...",
    showIndex: true,
    activeKey: "active",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "description", label: "Mô tả" },
      { name: "analyst", label: "Người phân tích", type: "select", options: staffOpts, empty: "-chọn người phân tích-" },
      { name: "attachmentUrl", label: "File đính kèm", type: "url", placeholder: "Đường dẫn tài liệu (Google Drive…)" },
      { name: "recordTemplate1", label: "Mẫu biên bản 1", type: "select", options: opts(RECORD_TEMPLATES), empty: "-chọn mẫu biên bản-" },
      { name: "recordTemplate2", label: "Mẫu biên bản 2", type: "select", options: opts(RECORD_TEMPLATES), empty: "-chọn mẫu biên bản-" },
      { name: "isokinetic", label: "Phương pháp lấy mẫu khí: Đẳng động lực", type: "checkbox" },
      { name: "quickMeasure", label: "Phương pháp lấy mẫu khí: Đo nhanh", type: "checkbox" },
      { name: "subcontractorMethod", label: "Phương pháp của nhà thầu phụ", type: "checkbox" },
      { name: "active", label: "Đang dùng", type: "checkbox" },
    ],
    defaults: { name: "", description: "", active: true, analyst: "", attachmentUrl: "", recordTemplate1: "", recordTemplate2: "", isokinetic: false, quickMeasure: false, subcontractorMethod: false },
    columns: [{ label: "Tên", get: (r) => r.name }, { label: "Mô tả", get: (r) => r.description }],
    validate: needName("tên phương pháp"),
  },
  {
    slug: "analyte-groups",
    store: analyteGroupStore,
    listTitle: "Danh sách nhóm chỉ tiêu phân tích",
    searchPlaceholder: "Tên nhóm...",
    filter: (r) => !r.isMtld,
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "description", label: "Mô tả" },
      { name: "resultTemplate", label: "Mẫu phiếu kết quả", type: "select", options: opts(RECORD_TEMPLATES), empty: "-không chọn-" },
      { name: "testField", label: "Lĩnh vực thử nghiệm", type: "select", options: opts(["Hóa học", "Sinh học"]) },
      { name: "owner", label: "Người phụ trách", type: "select", options: staffOpts, empty: "" },
      { name: "sort", label: "Thứ tự", type: "number" },
    ],
    defaults: { name: "", sort: 0, isMtld: false, description: "", resultTemplate: "", testField: "Hóa học", owner: "" },
    columns: [{ label: "Tên", get: (r) => r.name }, { label: "Mô tả", get: (r) => r.description }],
    sort: bySort,
    validate: needName("tên nhóm"),
  },
  {
    slug: "mtld-groups",
    store: analyteGroupStore,
    listTitle: "Danh sách nhóm chỉ tiêu Môi trường lao động",
    searchPlaceholder: "Tên nhóm...",
    filter: (r) => Boolean(r.isMtld),
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "description", label: "Mô tả" },
      { name: "sort", label: "Thứ tự", type: "number" },
    ],
    defaults: { name: "", sort: 0, isMtld: true, description: "", resultTemplate: "", testField: "Hóa học", owner: "" },
    columns: [{ label: "Tên", get: (r) => r.name }, { label: "Mô tả", get: (r) => r.description }],
    sort: bySort,
    validate: needName("tên nhóm"),
  },
  {
    slug: "sample-types",
    store: sampleTypeStore,
    listTitle: "Danh sách loại mẫu",
    searchPlaceholder: "Tên loại mẫu...",
    activeKey: "active",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "englishName", label: "Tên tiếng Anh" },
      { name: "description", label: "Mô tả" },
      { name: "hazardous", label: "Nguy hại", type: "checkbox" },
      { name: "prefix", label: "Tiền tố", required: true, placeholder: "VD: NM (không dấu – in trên mã vạch)" },
      { name: "sort", label: "Thứ tự", type: "number" },
      { name: "minQuantity", label: "Số lượng tối thiểu" },
      { name: "defaultContainer", label: "Dụng cụ lưu mặc định", type: "select", options: containerTypeOpts, empty: "" },
      { name: "recordTemplate", label: "Mẫu biên bản 1", type: "select", options: opts(RECORD_TEMPLATES), empty: "-không chọn-" },
      { name: "recordTemplate2", label: "Mẫu biên bản 2", type: "select", options: opts(RECORD_TEMPLATES), empty: "-không chọn-" },
      { name: "active", label: "Đang dùng", type: "checkbox" },
    ],
    defaults: { name: "", prefix: "", sort: 0, defaultContainer: "", description: "", active: true, hazardous: false, minQuantity: "", recordTemplate: "", englishName: "", recordTemplate2: "" },
    columns: [
      { label: "Tên", get: (r) => r.name },
      { label: "Tiền tố", get: (r) => r.prefix },
      { label: "Thứ tự", get: (r) => r.sort },
      { label: "Dụng cụ lưu mặc định", get: (r) => r.defaultContainer },
      { label: "Mô tả", get: (r) => r.description },
    ],
    search: (r) => `${r.name} ${r.prefix}`,
    sort: bySort,
    validate: (b) => (!String(b.name ?? "").trim() ? "Nhập tên loại mẫu" : !String(b.prefix ?? "").trim() ? "Nhập tiền tố mã mẫu" : !/^[A-Za-z0-9]+$/.test(String(b.prefix).trim()) ? "Tiền tố chỉ gồm chữ không dấu và số" : null),
  },
  {
    slug: "container-types",
    store: containerTypeStore,
    listTitle: "Danh sách loại dụng cụ lấy mẫu",
    searchPlaceholder: "Tên loại dụng cụ...",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "description", label: "Mô tả" },
    ],
    defaults: { name: "", symbol: "", volume: "", note: "", description: "" },
    columns: [{ label: "Tên", get: (r) => r.name }, { label: "Mô tả", get: (r) => r.description || r.note }],
    validate: needName(),
  },
  {
    slug: "sampling-containers",
    store: samplingContainerStore,
    listTitle: "Danh sách dụng cụ lấy mẫu",
    searchPlaceholder: "Tên dụng cụ...",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "symbol", label: "Ký hiệu" },
      { name: "unit", label: "Đơn vị" },
      { name: "description", label: "Mô tả" },
      { name: "containerType", label: "Loại", type: "select", options: containerTypeOpts, empty: "" },
      { name: "lifetimeMonths", label: "Thời gian sử dụng (tháng)" },
    ],
    defaults: { name: "", symbol: "", unit: "", description: "", containerType: "", lifetimeMonths: "" },
    columns: [
      { label: "Tên", get: (r) => r.name },
      { label: "Ký hiệu", get: (r) => r.symbol },
      { label: "Đơn vị", get: (r) => r.unit },
      { label: "Loại", get: (r) => r.containerType },
    ],
    search: (r) => `${r.name} ${r.symbol}`,
    validate: needName(),
  },
  {
    slug: "preservations",
    store: preservationStore,
    listTitle: "Danh sách bảo quản",
    searchPlaceholder: "Tên bảo quản...",
    showIndex: true,
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "sampleTypeId", label: "Loại mẫu", type: "select", options: sampleTypeOpts, empty: "" },
      { name: "description", label: "Mô tả" },
      { name: "isField", label: "Quan trắc", type: "checkbox" },
    ],
    defaults: { name: "", description: "", sampleTypeId: "", isField: false },
    columns: [
      { label: "Tên", get: (r) => r.name },
      { label: "Loại mẫu", get: (r) => r.$sampleType ?? "" },
      { label: "Quan trắc", get: (r) => (r.isField ? "✓" : "") },
    ],
    validate: needName("cách bảo quản"),
  },
  {
    slug: "subcontractors",
    store: subcontractorStore,
    listTitle: "Danh sách thầu phụ",
    newTitle: "Tạo thầu phụ",
    editTitle: (r) => r.name,
    formSubtitle: "Thông tin thầu phụ",
    searchPlaceholder: "Tên hoặc mã...",
    showIndex: true,
    activeKey: "active",
    fields: [
      { name: "name", label: "Tên cơ quan", required: true },
      { name: "code", label: "Mã cơ quan" },
      { name: "taxCode", label: "Mã số thuế" },
      { name: "phone", label: "Số điện thoại" },
      { name: "fax", label: "Fax" },
      { name: "email", label: "Email" },
      { name: "address", label: "Địa chỉ" },
      { name: "invoiceAddress", label: "Địa chỉ hóa đơn" },
      { name: "contact", label: "Người liên lạc", type: "select", options: staffOpts, empty: "-chọn liên lạc-" },
      { name: "asInternal", label: "Áp dụng như không thầu phụ", type: "checkbox" },
      { name: "active", label: "Đang dùng", type: "checkbox" },
    ],
    defaults: { name: "", code: "", phone: "", note: "", active: true, taxCode: "", fax: "", email: "", address: "", invoiceAddress: "", contact: "", asInternal: false },
    columns: [
      { label: "Tên cơ quan", get: (r) => r.name },
      { label: "Mã cơ quan", get: (r) => r.code },
      { label: "Số điện thoại", get: (r) => r.phone },
    ],
    search: (r) => `${r.name} ${r.code}`,
    validate: (b) => (!String(b.name ?? "").trim() ? "Nhập tên cơ quan" : ["VILAS", "Nội bộ"].includes(String(b.name).trim()) ? "Tên này đã dành cho phạm vi VILAS / Nội bộ" : null),
  },
  {
    slug: "instrument-types",
    store: instrumentTypeStore,
    listTitle: "Danh sách thiết bị",
    searchPlaceholder: "Tên thiết bị...",
    showIndex: true,
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "description", label: "Mô tả" },
      { name: "unit", label: "Đơn vị" },
      { name: "depreciationYears", label: "Năm khấu hao" },
      { name: "shiftsPerYear", label: "Số ca máy sử dụng 1 năm", type: "number", nullable: true },
      { name: "manualUrl", label: "Link hướng dẫn sử dụng", type: "url" },
      { name: "isField", label: "Thiết bị quan trắc", type: "checkbox" },
      { name: "departmentId", label: "Phòng ban", type: "select", options: departmentOpts, empty: "Chọn phòng ban/chi nhánh" },
    ],
    defaults: { name: "", note: "", description: "", unit: "", depreciationYears: "", shiftsPerYear: null, manualUrl: "", isField: false, departmentId: "" },
    columns: [
      { label: "Tên", get: (r) => r.name },
      { label: "Đơn vị", get: (r) => r.unit },
      { label: "Năm khấu hao", get: (r) => r.depreciationYears },
      { label: "Số ca máy sử dụng 1 năm", get: (r) => r.shiftsPerYear ?? "" },
      { label: "Mô tả", get: (r) => r.description || r.note },
    ],
    validate: needName("tên thiết bị"),
  },
  {
    slug: "manufacturers",
    store: manufacturerStore,
    listTitle: "Danh sách nhà sản xuất",
    searchPlaceholder: "Tên nhà sản xuất...",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "note", label: "Mô tả" },
    ],
    defaults: { name: "", country: "", note: "" },
    columns: [{ label: "Tên", get: (r) => r.name }, { label: "Mô tả", get: (r) => r.note }],
    validate: needName("tên nhà sản xuất"),
  },
  {
    slug: "departments",
    store: departmentStore,
    listTitle: "Danh sách phòng ban/chi nhánh",
    searchPlaceholder: "Tên phòng ban...",
    fields: [
      { name: "name", label: "Tên phòng ban/chi nhánh", required: true },
      { name: "code", label: "Ký hiệu" },
    ],
    defaults: { name: "", code: "", sort: 0 },
    columns: [{ label: "Tên phòng ban/chi nhánh", get: (r) => r.name }, { label: "Ký hiệu", get: (r) => r.code }],
    validate: needName("tên phòng ban"),
  },
  {
    slug: "lab-formulas",
    store: labFormulaStore,
    listTitle: "Danh sách công thức",
    searchPlaceholder: "Tên công thức...",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "formula", label: "Công thức", placeholder: "VD: (A - B) * V / m" },
      { name: "fieldVariables", label: "Biến số hiện trường", placeholder: "Các biến đo ngoài hiện trường, cách nhau dấu phẩy" },
      { name: "description", label: "Mô tả" },
    ],
    defaults: { name: "", formula: "", fieldVariables: "", description: "" },
    columns: [
      { label: "Tên", get: (r) => r.name },
      { label: "Công thức", get: (r) => r.formula },
      { label: "Số lượng biến", get: (r) => new Set(String(r.formula ?? "").match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []).size || "" },
    ],
    validate: needName("tên công thức"),
  },
  {
    slug: "lab-products",
    store: labProductStore,
    listTitle: "Danh sách dụng cụ phân tích",
    searchPlaceholder: "Tên hoặc mã...",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "code", label: "Mã" },
      { name: "unit", label: "Đơn vị" },
      { name: "description", label: "Mô tả" },
      { name: "lifetimeMonths", label: "Thời gian sử dụng (tháng)" },
    ],
    defaults: { name: "", code: "", unit: "", description: "", lifetimeMonths: "" },
    columns: [
      { label: "Tên", get: (r) => r.name },
      { label: "Mã", get: (r) => r.code },
      { label: "Đơn vị", get: (r) => r.unit },
      { label: "Thời gian sử dụng (tháng)", get: (r) => r.lifetimeMonths },
    ],
    search: (r) => `${r.name} ${r.code}`,
    validate: needName("tên dụng cụ"),
  },
  {
    slug: "event-types",
    store: eventTypeStore,
    listTitle: "Loại kế hoạch",
    searchPlaceholder: "Tên loại kế hoạch...",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "description", label: "Mô tả" },
      { name: "sort", label: "Thứ tự", type: "number" },
    ],
    defaults: { name: "", description: "", sort: 0 },
    columns: [{ label: "Tên", get: (r) => r.name }, { label: "Thứ tự", get: (r) => r.sort }],
    sort: bySort,
    validate: needName(),
  },
  {
    slug: "industries",
    store: industryStore,
    listTitle: "Ngành công nghiệp",
    searchPlaceholder: "Tên ngành...",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "description", label: "Mô tả" },
    ],
    defaults: { name: "", description: "" },
    columns: [{ label: "Tên", get: (r) => r.name }],
    validate: needName("tên ngành"),
  },
  {
    slug: "calibration-units",
    store: calibrationUnitStore,
    listTitle: "Danh sách đơn vị hiệu chuẩn",
    searchPlaceholder: "Tên đơn vị...",
    fields: orgFields("Tên đơn vị hiệu chuẩn"),
    defaults: { name: "", taxCode: "", phone: "", fax: "", email: "", address: "", invoiceAddress: "" },
    columns: [{ label: "Tên đơn vị hiệu chuẩn", get: (r) => r.name }],
    validate: needName("tên đơn vị"),
  },
  {
    slug: "request-priorities",
    store: requestPriorityStore,
    listTitle: "Danh sách mức ưu tiên của yêu cầu",
    searchPlaceholder: "Tên mức ưu tiên...",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "description", label: "Mô tả" },
      { name: "sort", label: "Thứ tự", type: "number" },
      { name: "surchargePct", label: "Giá tăng thêm %", type: "number" },
      { name: "isDefault", label: "Mặc định", type: "checkbox" },
    ],
    defaults: { name: "", description: "", sort: 0, surchargePct: 0, isDefault: false },
    columns: [
      { label: "Tên", get: (r) => r.name },
      { label: "Mô tả", get: (r) => r.description },
      { label: "Mặc định", get: (r) => (r.isDefault ? "✓" : "") },
    ],
    sort: bySort,
    validate: (b) => (!String(b.name ?? "").trim() ? "Nhập tên" : Number(b.surchargePct) < 0 ? "Giá tăng thêm không được âm" : null),
  },
  {
    slug: "lab-infos",
    store: labInfoStore,
    listTitle: "Danh sách thông tin công ty",
    searchPlaceholder: "Tên...",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "address", label: "Địa chỉ" },
      { name: "taxCode", label: "Mã số thuế" },
      { name: "phone", label: "Số điện thoại" },
      { name: "fax", label: "Fax" },
      { name: "email", label: "Email" },
      { name: "website", label: "Website" },
      { name: "director", label: "Giám đốc" },
      { name: "head", label: "Trưởng phòng" },
      { name: "vimcertNo", label: "Số hiệu VIMCERT" },
      { name: "vilasNo", label: "Số hiệu VILAS" },
    ],
    defaults: { name: "", address: "", taxCode: "", phone: "", fax: "", email: "", website: "", director: "", head: "", vimcertNo: "", vilasNo: "" },
    columns: [
      { label: "Tên", get: (r) => r.name },
      { label: "Địa chỉ", get: (r) => r.address },
      { label: "Mã số thuế", get: (r) => r.taxCode },
    ],
    validate: needName(),
  },
  {
    slug: "standards",
    store: standardStore,
    listTitle: "Danh sách quy chuẩn",
    searchPlaceholder: "Tên quy chuẩn...",
    activeKey: "active",
    fields: [
      { name: "name", label: "Tên", required: true, placeholder: "VD: QCVN 08:2023/BTNMT" },
      { name: "description", label: "Mô tả" },
      { name: "englishDescription", label: "Mô tả tiếng Anh" },
      { name: "sampleTypeId", label: "Loại", type: "select", options: sampleTypeOpts, empty: "" },
      { name: "docUrl", label: "Đường link tài liệu", type: "url" },
      { name: "active", label: "Đang dùng", type: "checkbox" },
    ],
    defaults: { name: "", description: "", englishDescription: "", sampleTypeId: "", docUrl: "", active: true },
    columns: [
      { label: "Tên", get: (r) => r.name },
      { label: "Mô tả", get: (r) => r.description },
      { label: "Loại mẫu", get: (r) => r.$sampleType ?? "" },
    ],
    rowLinks: (r) => [{ label: "Cột quy chuẩn", href: `/specifications?standard=${r.id}` }],
    validate: needName("tên quy chuẩn"),
  },
  {
    slug: "test-records",
    store: testRecordStore,
    listTitle: "Danh sách Biên bản thử nghiệm",
    searchPlaceholder: "Tên biên bản...",
    fields: [
      { name: "name", label: "Tên", required: true },
      { name: "description", label: "Mô tả" },
    ],
    defaults: { name: "", description: "" },
    columns: [{ label: "Tên", get: (r) => r.name }],
    rowLinks: (r) => [{ label: "Chỉ tiêu", href: `/test-records/${r.id}/analytes` }],
    validate: needName("tên biên bản"),
  },
];

export const catalogOf = (slug: string) => CATALOGS.find((c) => c.slug === slug);

/** Nạp các lựa chọn động của ô chọn để gửi xuống form (client). */
export async function resolveFields(fields: XField[]) {
  return Promise.all(
    fields.map(async (f) => ({ ...f, options: typeof f.options === "function" ? await f.options() : f.options })),
  ) as Promise<(Omit<XField, "options"> & { options?: Opt[] })[]>;
}

/** Thêm tên loại mẫu ($sampleType) cho các danh mục có cột Loại mẫu. */
export async function decorate(rows: Row[]): Promise<Row[]> {
  if (!rows.some((r) => "sampleTypeId" in r)) return rows;
  const types = new Map((await sampleTypeStore.list()).map((t) => [t.id, t.name]));
  return rows.map((r) => ({ ...r, $sampleType: types.get(r.sampleTypeId) ?? "" }));
}

/** "Thông tin phương pháp phân tích" từ "Danh sách phương pháp phân tích". */
export const subtitleOf = (listTitle: string, explicit?: string) =>
  explicit ?? `Thông tin ${listTitle.replace(/^Danh sách\s+/i, "").replace(/^./, (c) => c.toLowerCase())}`;
