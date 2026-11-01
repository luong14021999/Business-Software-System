import type { CrudField } from "@/components/crud/entity-form-dialog";
import { BATCH_STATUSES } from "@/lib/modules/m2/orders";

/** Trường thông tin mẻ thử nghiệm (thêm / sửa). */
export function batchFields(o: { methods: string[]; staff: string[]; equipment: { code: string; name: string }[]; edit?: boolean }): CrudField[] {
  return [
    { name: "method", label: "Phương pháp", type: "select", required: true, options: o.methods, full: true },
    { name: "analyst", label: "Người phân tích", type: "select", options: o.staff },
    { name: "instrumentCode", label: "Thiết bị phân tích", type: "select", options: [{ value: "", label: "— Chọn thiết bị —" }, ...o.equipment.map((e) => ({ value: e.code, label: `${e.code} · ${e.name}` }))] },
    { name: "chemicals", label: "Hóa chất, chất chuẩn sử dụng", type: "textarea", placeholder: "Tên hóa chất – số lô – hạn dùng" },
    ...(o.edit
      ? ([
          { name: "startedAt", label: "Ngày bắt đầu", type: "date" },
          { name: "finishedAt", label: "Ngày kết thúc", type: "date" },
          { name: "status", label: "Trạng thái", type: "select", options: [...BATCH_STATUSES] },
        ] as CrudField[])
      : []),
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
}
