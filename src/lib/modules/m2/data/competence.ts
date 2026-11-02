// ISO/IEC 17025:2017 – Đợt 2: cam kết (§4.1, §4.2), ủy quyền & năng lực (§6.2),
// nhà cung cấp (§6.6), kiểm tra xác nhận / xác nhận giá trị sử dụng phương pháp (§7.2).
import { columnsMapping, createEntityStore } from "../../../platform/data/factory";
import { daysUntil } from "@/lib/platform/dates";

/** Bản ghi còn hiệu lực theo ngày: chưa đặt hạn = còn hiệu lực. */
export const stillValid = (validUntil: string) =>
  !validUntil || daysUntil(validUntil) >= 0;

// ── §4.1 + §4.2 Cam kết khách quan & bảo mật ────────────────────────
export const COMMITMENT_KINDS = ["Khách quan & bảo mật", "Khách quan", "Bảo mật"] as const;

export type StaffCommitment = {
  id: string;
  staffName: string;
  kind: (typeof COMMITMENT_KINDS)[number];
  signedAt: string;
  validUntil: string;
  conflictDeclared: string;
  docRef: string;
  note: string;
};

export const staffCommitmentStore = createEntityStore<StaffCommitment>(
  "staff-commitments",
  [],
  columnsMapping<StaffCommitment>("staff_commitments", {
    staffName: "text",
    kind: "text",
    signedAt: "date",
    validUntil: "date",
    conflictDeclared: "text",
    docRef: "text",
    note: "text",
  }),
);

/** Nhân viên đã có cam kết hiệu lực bao trùm cả khách quan và bảo mật? */
export function commitmentCoverage(commitments: StaffCommitment[], staffName: string) {
  const valid = commitments.filter(
    (c) => c.staffName === staffName && c.signedAt && stillValid(c.validUntil),
  );
  const impartiality = valid.some((c) => c.kind !== "Bảo mật");
  const confidentiality = valid.some((c) => c.kind !== "Khách quan");
  return { impartiality, confidentiality, complete: impartiality && confidentiality };
}

// ── §6.2 Ủy quyền theo phép thử ─────────────────────────────────────
export const AUTH_ROLES = [
  "Thực hiện phép thử",
  "Xem xét kết quả",
  "Phê duyệt & ký phiếu kết quả",
] as const;
export const AUTH_STATUSES = ["Hiệu lực", "Tạm dừng", "Hết hiệu lực"] as const;

export type TestAuthorization = {
  id: string;
  staffName: string;
  testLabel: string;
  role: (typeof AUTH_ROLES)[number];
  authorizedAt: string;
  authorizedBy: string;
  validUntil: string;
  evidence: string;
  nextMonitorAt: string;
  status: (typeof AUTH_STATUSES)[number];
  note: string;
};

export const testAuthorizationStore = createEntityStore<TestAuthorization>(
  "test-authorizations",
  [],
  columnsMapping<TestAuthorization>("test_authorizations", {
    staffName: "text",
    testLabel: "text",
    role: "text",
    authorizedAt: "date",
    authorizedBy: "text",
    validUntil: "date",
    evidence: "text",
    nextMonitorAt: "date",
    status: "text",
    note: "text",
  }),
);

export const isActiveAuthorization = (a: TestAuthorization) =>
  a.status === "Hiệu lực" && stillValid(a.validUntil);

// ── §6.6 Nhà cung cấp ───────────────────────────────────────────────
export const SUPPLIER_CATEGORIES = [
  "Hóa chất & chất chuẩn",
  "Dụng cụ – vật tư",
  "Thiết bị",
  "Dịch vụ hiệu chuẩn",
  "Thử nghiệm thành thạo (PT)",
  "Bảo trì – sửa chữa",
  "Khác",
] as const;
export const SUPPLIER_STATUSES = ["Được phê duyệt", "Đang đánh giá", "Ngừng sử dụng"] as const;
export const SUPPLIER_RESULTS = ["Đạt", "Đạt có điều kiện", "Không đạt"] as const;

export type Supplier = {
  id: string;
  code: string;
  name: string;
  category: (typeof SUPPLIER_CATEGORIES)[number];
  provides: string;
  contact: string;
  phone: string;
  accreditation: string;
  status: (typeof SUPPLIER_STATUSES)[number];
  evaluatedAt: string;
  result: string;
  nextEvaluationAt: string;
  criteria: string;
  note: string;
  taxCode: string;
  fax: string;
  email: string;
  address: string;
  invoiceAddress: string;
  active: boolean;
};

export const supplierStore = createEntityStore<Supplier>(
  "suppliers",
  [],
  columnsMapping<Supplier>("suppliers", {
    code: "text",
    name: "text",
    category: "text",
    provides: "text",
    contact: "text",
    phone: "text",
    accreditation: "text",
    status: "text",
    evaluatedAt: "date",
    result: "text",
    nextEvaluationAt: "date",
    criteria: "text",
    taxCode: "text",
    fax: "text",
    email: "text",
    address: "text",
    invoiceAddress: "text",
    active: "bool",
    note: "text",
  }),
);

// ── §7.2 Kiểm tra xác nhận / xác nhận giá trị sử dụng phương pháp ────
export const VALIDATION_KINDS = [
  "Kiểm tra xác nhận phương pháp tiêu chuẩn",
  "Xác nhận giá trị sử dụng phương pháp nội bộ",
  "Xác nhận lại khi có thay đổi",
] as const;
export const VALIDATION_CONCLUSIONS = ["Đạt", "Không đạt", "Đang thực hiện"] as const;

export type MethodValidation = {
  id: string;
  code: string;
  testLabel: string;
  kind: (typeof VALIDATION_KINDS)[number];
  performedAt: string;
  performedBy: string;
  lod: string;
  loq: string;
  linearity: string;
  repeatability: string;
  reproducibility: string;
  recovery: string;
  uncertainty: string;
  conclusion: (typeof VALIDATION_CONCLUSIONS)[number];
  approvedBy: string;
  nextReviewAt: string;
  note: string;
};

export const methodValidationStore = createEntityStore<MethodValidation>(
  "method-validations",
  [],
  columnsMapping<MethodValidation>("method_validations", {
    code: "text",
    testLabel: "text",
    kind: "text",
    performedAt: "date",
    performedBy: "text",
    lod: "text",
    loq: "text",
    linearity: "text",
    repeatability: "text",
    reproducibility: "text",
    recovery: "text",
    uncertainty: "text",
    conclusion: "text",
    approvedBy: "text",
    nextReviewAt: "date",
    note: "text",
  }),
);
