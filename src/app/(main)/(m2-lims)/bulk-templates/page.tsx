import { LabPage } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import type { CrudField } from "@/components/crud/entity-form-dialog";
import { sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { bulkTemplateStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Mẫu bóc tách: tạo ở trang Bóc tách (nút "Lưu bảng thành mẫu"); ở đây đổi tên, loại mẫu hoặc xóa. */
export default async function BulkTemplatesPage() {
  const [items, types, access] = await Promise.all([bulkTemplateStore.list(), sampleTypeStore.list(), currentAccess()]);
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const fields: CrudField[] = [
    { name: "name", label: "Tên", required: true, full: true },
    { name: "sampleTypeId", label: "Loại mẫu", type: "select", options: types.map((t) => ({ value: t.id, label: t.name })) },
    { name: "description", label: "Mô tả", type: "textarea" },
  ];
  return (
    <LabPage title="Danh sách template bóc tách" subtitle="Danh sách chỉ tiêu dựng sẵn theo loại mẫu. Tạo mới: ở trang Bóc tách của đơn hàng, chọn chỉ tiêu rồi bấm “Lưu bảng thành mẫu”.">
      <CatalogTable
        entity="bulk-templates"
        canWrite={access.can("write.reception")}
        fields={fields}
        emptyText="Chưa có mẫu bóc tách"
        headers={["Tên", "Loại mẫu", "Chỉ tiêu", "Mô tả"]}
        rows={items.sort((a, b) => a.name.localeCompare(b.name)).map((t) => ({
          id: t.id,
          label: t.name,
          initial: t,
          cells: [t.name, typeName.get(t.sampleTypeId) ?? "—", <span key="l" className="text-xs">{t.lines.length} chỉ tiêu: {t.lines.map((l) => l.name).join("; ")}</span>, t.description],
        }))}
      />
    </LabPage>
  );
}
