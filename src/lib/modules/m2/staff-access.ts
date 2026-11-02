// Vai trò và quyền cụ thể trên trang Nhân viên (như XaLab), quy về vai trò / quyền của hệ thống.
import type { Permission, Role } from "@/lib/platform/permissions";

/** Ô "Vai trò" theo thứ tự XaLab → vai trò hệ thống. */
export const STAFF_ROLES: { role: Role; label: string }[] = [
  { role: "Quản trị", label: "Quản trị" },
  { role: "NV phân tích", label: "Nhân viên phân tích" },
  { role: "NV nhận mẫu", label: "Nhân viên nhận mẫu" },
  { role: "Quản lý", label: "Quản lý" },
  { role: "NV kinh doanh", label: "Nhân viên bán hàng" },
  { role: "NV lấy mẫu", label: "Nhân viên lấy mẫu" },
];

/** "Các quyền cụ thể" chặn riêng từng người; mỗi ô chặn một nhóm quyền của hệ thống. */
export const STAFF_DENIALS: { key: string; label: string; perms: Permission[] }[] = [
  { key: "customers", label: "Không được phép xem thông tin khách hàng", perms: ["view.customers"] },
  { key: "stats", label: "Không được phép xem Thống kê", perms: ["view.stats"] },
  { key: "approve", label: "Không được phép duyệt Kết quả", perms: ["results.qa", "results.approve"] },
];

/** Ô đã tích → danh sách quyền bị chặn (lưu vào staff.denied). */
export const deniedFromKeys = (keys: string[]) => [...new Set(STAFF_DENIALS.filter((d) => keys.includes(d.key)).flatMap((d) => d.perms))];
/** Danh sách quyền bị chặn → ô cần tích (mọi quyền của ô đều bị chặn). */
export const keysFromDenied = (denied: string[]) => STAFF_DENIALS.filter((d) => d.perms.every((p) => denied.includes(p))).map((d) => d.key);

/** Giữ các vai trò ngoài trang Nhân viên (M1, M3…), thay phần vai trò của trang bằng các ô đã tích. */
export function mergeRoles(current: string[], picked: string[]): string[] {
  const own = new Set<string>(STAFF_ROLES.map((r) => r.role));
  return [...current.filter((r) => !own.has(r)), ...STAFF_ROLES.map((r) => r.role).filter((r) => picked.includes(r))];
}
