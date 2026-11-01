import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { CreateBatchButton } from "@/components/m2/settings/create-batch-button";
import { analyteStore } from "@/lib/modules/m2/data/orders";
import { batchTemplateStore } from "@/lib/modules/m2/data/settings";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

export default async function BatchTemplatesPage() {
  const [items, analytes, staff, equipment, access] = await Promise.all([batchTemplateStore.list(), analyteStore.list(), staffStore.list(), equipmentStore.list(), currentAccess()]);
  const canWrite = access.can("results.enter");
  const fields: CrudField[] = [
    { name: "name", label: "Tên mẫu mẻ", required: true, full: true },
    { name: "method", label: "Phương pháp", type: "select", options: [...new Set(analytes.map((a) => a.method).filter(Boolean))].sort(), full: true },
    { name: "analyst", label: "Người phân tích", type: "select", options: staff.map((s) => s.fullName) },
    { name: "instrumentCode", label: "Thiết bị", type: "select", options: [{ value: "", label: "— Chọn thiết bị —" }, ...equipment.map((e) => ({ value: e.code, label: `${e.code} · ${e.name}` }))] },
    { name: "chemicals", label: "Hóa chất, chất chuẩn", type: "textarea" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  return (
    <LabPage
      title="Danh sách template mẻ thử nghiệm"
      subtitle="Cấu hình hay dùng của một lần chạy phân tích; bấm “Tạo mẻ” để mở mẻ mới với sẵn phương pháp, người phân tích, thiết bị, hóa chất"
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/batch-templates" title="Thêm mẫu mẻ" fields={fields} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="batch-templates"
        canWrite={canWrite}
        fields={fields}
        emptyText="Chưa có mẫu mẻ thử nghiệm"
        headers={["Tên", "Phương pháp", "Người phân tích", "Thiết bị"]}
        rows={items.sort((a, b) => a.name.localeCompare(b.name)).map((t) => ({
          id: t.id,
          label: t.name,
          initial: t,
          cells: [t.name, t.method || "—", t.analyst || "—", t.instrumentCode || "—"],
          extra: canWrite ? <CreateBatchButton templateId={t.id} /> : undefined,
        }))}
      />
    </LabPage>
  );
}
