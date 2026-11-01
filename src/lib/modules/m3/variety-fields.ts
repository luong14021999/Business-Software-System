// Trường form lý lịch giống dùng chung cho danh sách và trang hồ sơ giống.
import type { CrudField } from "@/components/crud/entity-form-dialog";
import { BREED_KINDS, VARIETY_STATUSES } from "@/lib/modules/m3/data/breeding";
import { CIRCULATION_TYPES, VARIETY_SCOPES } from "@/lib/modules/m3/breeding-rules";

export function varietyFields(): CrudField[] {
  return [
    { name: "code", label: "Mã giống", required: true, mono: true, placeholder: "VD: GI-001" },
    { name: "name", label: "Tên giống", required: true },
    { name: "scope", label: "Phạm vi", type: "select", options: [...VARIETY_SCOPES] },
    { name: "kind", label: "Nhóm", type: "select", options: [...BREED_KINDS] },
    { name: "species", label: "Loài", placeholder: "VD: Lúa, Ngô, Lợn, Tôm…" },
    { name: "owner", label: "Tác giả / chủ sở hữu" },
    { name: "origin", label: "Nguồn gốc / tổ hợp lai", full: true },
    { name: "status", label: "Trạng thái", type: "select", options: [...VARIETY_STATUSES] },
    { name: "recognitionNo", label: "Số quyết định công nhận", mono: true },
    { name: "recognizedAt", label: "Ngày công nhận", type: "date" },
    { name: "circulationType", label: "Hình thức lưu hành", type: "select", options: [...CIRCULATION_TYPES] },
    { name: "circulationNo", label: "Số QĐ / số tự công bố lưu hành", mono: true },
    { name: "circulationAt", label: "Ngày lưu hành", type: "date" },
    { name: "regions", label: "Vùng / địa phương khuyến cáo", full: true },
    { name: "areaHa", label: "Diện tích / quy mô trên địa bàn tỉnh (ha)", type: "number" },
    { name: "traits", label: "Đặc điểm chính (thời gian sinh trưởng, năng suất, chống chịu…)", type: "textarea" },
    { name: "isPublic", label: "Giới thiệu trên cổng công khai", type: "bool", boolLabels: ["Công bố", "Không công bố"], defaultValue: 0 },
    { name: "publicSummary", label: "Mô tả ngắn cho người dùng (hiện trên cổng)", type: "textarea" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
}
