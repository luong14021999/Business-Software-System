import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { preservationStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Cách bảo quản", required: true, full: true, placeholder: "VD: Làm lạnh 2–6 °C" },
  { name: "description", label: "Mô tả", type: "textarea" },
];

export default async function Page() {
  const [items, access] = await Promise.all([preservationStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  return (
    <LabPage
      title="Danh sách bảo quản"
      subtitle="Cách bảo quản mẫu (nhiệt độ, chất bảo quản, thời gian lưu tối đa)"
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/preservations" title="Thêm" fields={FIELDS} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="preservations"
        canWrite={canWrite}
        fields={FIELDS}
        headers={["Cách bảo quản", "Mô tả"]}
        rows={items.sort((a, b) => a.name.localeCompare(b.name, "vi")).map((x) => ({ id: x.id, label: x.name, initial: x, cells: [x.name, x.description] }))}
      />
    </LabPage>
  );
}
