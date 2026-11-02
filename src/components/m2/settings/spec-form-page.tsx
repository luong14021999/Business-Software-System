import { LabPage } from "@/components/m2/lab-ui/page";
import { XForm, type XFormField } from "@/components/m2/lab-ui/x-form";
import { standardStore } from "@/lib/modules/m2/data/catalogs";
import type { Specification } from "@/lib/modules/m2/data/orders";
import { currentAccess } from "@/lib/platform/data/access";

/** Form cột quy chuẩn như XaLab: Tên, Tên tiếng Anh, Tên khi in, Quy chuẩn, Mô tả, Ghi chú khi in. */
export async function SpecFormPage({ spec }: { spec?: Specification }) {
  const [standards, access] = await Promise.all([standardStore.list(), currentAccess()]);
  const fields: XFormField[] = [
    { name: "columnName", label: "Tên", required: true },
    { name: "englishName", label: "Tên tiếng Anh" },
    { name: "printName", label: "Tên khi in" },
    { name: "standardId", label: "Quy chuẩn", type: "select", empty: "", options: standards.filter((s) => s.active || s.id === spec?.standardId).sort((a, b) => a.name.localeCompare(b.name, "vi")).map((s) => ({ value: s.id, label: s.name })) },
    { name: "note", label: "Mô tả", type: "textarea" },
    { name: "printNote", label: "Ghi chú khi in" },
    { name: "active", label: "Đang dùng", type: "checkbox" },
  ];
  // Cột cũ chưa gắn Quy chuẩn: giữ tên quy chuẩn đã ghi (gửi kèm) để không mất khi lưu.
  return (
    <LabPage title={spec ? `Sửa bản ghi ${spec.columnName || spec.name}` : "Tạo mới"} subtitle={<span className="text-lg text-[#333]">Thông tin cột quy chuẩn</span>}>
      <XForm
        fields={fields}
        initial={{ columnName: spec?.columnName || spec?.name || "", englishName: spec?.englishName ?? "", printName: spec?.printName ?? "", standardId: spec?.standardId ?? "", note: spec?.note ?? "", printNote: spec?.printNote ?? "", active: spec?.active ?? true }}
        endpoint="/api/specifications"
        id={spec?.id}
        extra={spec && !spec.standardId ? { name: spec.name } : undefined}
        backHref="/specifications"
        editBase="/specifications"
        canWrite={access.can("write.quality")}
      />
    </LabPage>
  );
}
