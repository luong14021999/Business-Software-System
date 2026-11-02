// Trường form các trang Khách hàng theo đúng thứ tự form XaLab.
import type { Opt, XField } from "@/lib/modules/m2/catalog-registry";
import { PROVINCES } from "@/lib/modules/m2/orders";

const opts = (xs: readonly string[]): Opt[] => xs.map((x) => ({ value: x, label: x }));

export function customerFields(departments: Opt[], staff: Opt[] | null): XField[] {
  return [
    { name: "name", label: "Tên khách hàng", required: true },
    { name: "printName", label: "Tên khi in" },
    { name: "englishName", label: "Tên tiếng Anh" },
    { name: "code", label: "Mã khách hàng", placeholder: "Để trống để tự sinh (KH-năm-số)" },
    { name: "taxCode", label: "Mã số thuế" },
    { name: "bankAccount", label: "Số tài khoản" },
    { name: "phone", label: "Số điện thoại" },
    { name: "fax", label: "Fax" },
    { name: "email", label: "Email" },
    { name: "province", label: "Tỉnh/TP", type: "select", options: opts(PROVINCES), empty: "Chọn tỉnh/TP" },
    { name: "address", label: "Địa chỉ" },
    { name: "addressOld", label: "Địa chỉ trước 1/7/2025" },
    { name: "invoiceAddress", label: "Địa chỉ hóa đơn" },
    { name: "representative", label: "Người đại diện" },
    { name: "representativeTitle", label: "Chức danh" },
    { name: "departmentId", label: "Phòng ban/Chi nhánh", type: "select", options: departments, empty: "Chọn phòng ban/chi nhánh" },
    ...(staff ? [{ name: "createdBy", label: "Người tạo", type: "select", options: staff, empty: "" } as XField] : []),
    { name: "isRequestingUnit", label: "Đơn vị yêu cầu quan trắc", type: "checkbox" },
    { name: "isInspection", label: "Thanh tra", type: "checkbox" },
  ];
}

export const CONTACT_FIELDS: XField[] = [
  { name: "salutation", label: "Ông/bà", type: "select", options: opts(["Ông", "Bà"]) },
  { name: "name", label: "Họ và tên", required: true },
  { name: "title", label: "Chức danh" },
  { name: "department", label: "Phòng" },
  { name: "phone", label: "Số điện thoại" },
  { name: "phone2", label: "Số điện thoại 2" },
  { name: "email", label: "Email" },
];

export const LOCATION_FIELDS: XField[] = [
  { name: "name", label: "Tên địa điểm", required: true },
  { name: "oldName", label: "Tên địa điểm trước 1/7/2025" },
  { name: "englishName", label: "Tên tiếng Anh" },
  { name: "description", label: "Mô tả" },
];

export const POINT_FIELDS: XField[] = [
  { name: "name", label: "Tên", required: true },
  { name: "englishName", label: "Tên tiếng Anh" },
  { name: "sort", label: "Thứ tự", type: "number" },
  { name: "description", label: "Mô tả" },
  { name: "lat", label: "Vĩ độ (X)", type: "number", nullable: true },
  { name: "lng", label: "Kinh độ (Y)", type: "number", nullable: true },
];

export function contractFields(customers: Opt[]): XField[] {
  return [
    { name: "customerId", label: "Khách hàng", type: "select", options: customers, empty: "", required: true },
    { name: "contractNo", label: "Số hợp đồng", required: true },
    { name: "value", label: "Giá trị hợp đồng (đồng)", type: "number" },
    { name: "signedAt", label: "Ngày ký", type: "date" },
    { name: "liquidatedAt", label: "Ngày thanh lý", type: "date" },
    { name: "signerA", label: "Người ký bên A" },
    { name: "signerB", label: "Người ký bên B" },
    { name: "contractUrl", label: "Link hợp đồng", type: "url" },
    { name: "liquidationUrl", label: "Link biên bản thanh lý", type: "url" },
    { name: "invoiceUrl", label: "Link hóa đơn", type: "url" },
  ];
}

/** Trạng thái hợp đồng: đã thanh lý khi có ngày thanh lý (không sau hôm nay). */
export const contractStatus = (liquidatedAt: string, today: string) => (liquidatedAt && liquidatedAt.slice(0, 10) <= today ? "Đã thanh lý" : "Đang thực hiện");

/**
 * Các ngày quan trắc định kỳ trong [from, to] từ lịch (ngày / tháng hằng năm) của địa điểm.
 * Ngày không tồn tại trong tháng (VD 31/4) bị bỏ qua.
 */
export function scheduleDates(schedules: { fieldDay: number | null; fieldMonth: number | null }[], from: string, to: string) {
  const out: string[] = [];
  const y0 = Number(from.slice(0, 4));
  const y1 = Number(to.slice(0, 4));
  for (let y = y0; y <= y1; y++) {
    for (const s of schedules) {
      if (!s.fieldDay || !s.fieldMonth) continue;
      const d = new Date(Date.UTC(y, s.fieldMonth - 1, s.fieldDay));
      if (d.getUTCMonth() !== s.fieldMonth - 1) continue;
      const iso = d.toISOString().slice(0, 10);
      if (iso >= from && iso <= to) out.push(iso);
    }
  }
  return [...new Set(out)].sort();
}

/** Mã khách hàng kế tiếp khi để trống: KH-năm-số thứ tự 4 chữ số. */
export function nextCustomerCode(year: number, existing: string[]) {
  const head = `KH-${year}-`;
  const max = existing.reduce((m, c) => (c.startsWith(head) && /^\d+$/.test(c.slice(head.length)) ? Math.max(m, Number(c.slice(head.length))) : m), 0);
  return `${head}${String(max + 1).padStart(4, "0")}`;
}
