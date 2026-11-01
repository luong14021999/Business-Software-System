import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { instrumentTypeStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Tên loại thiết bị", required: true, full: true },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function Page() {
  const [items, access] = await Promise.all([instrumentTypeStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  return (
    <LabPage
      title="Danh sách loại thiết bị"
      subtitle="Phân loại thiết bị phân tích / quan trắc"
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/instrument-types" title="Thêm" fields={FIELDS} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="instrument-types"
        canWrite={canWrite}
        fields={FIELDS}
        headers={["Tên", "Ghi chú"]}
        rows={items.sort((a, b) => a.name.localeCompare(b.name, "vi")).map((x) => ({ id: x.id, label: x.name, initial: x, cells: [x.name, x.note] }))}
      />
    </LabPage>
  );
}
