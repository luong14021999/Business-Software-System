import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { manufacturerStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Tên nhà sản xuất", required: true, full: true },
  { name: "country", label: "Quốc gia" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function Page() {
  const [items, access] = await Promise.all([manufacturerStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  return (
    <LabPage
      title="Danh sách nhà sản xuất"
      subtitle="Hãng sản xuất thiết bị, hóa chất"
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/manufacturers" title="Thêm" fields={FIELDS} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="manufacturers"
        canWrite={canWrite}
        fields={FIELDS}
        headers={["Tên", "Quốc gia", "Ghi chú"]}
        rows={items.sort((a, b) => a.name.localeCompare(b.name, "vi")).map((x) => ({ id: x.id, label: x.name, initial: x, cells: [x.name, x.country, x.note] }))}
      />
    </LabPage>
  );
}
