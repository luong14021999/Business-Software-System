import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { containerTypeStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Tên dụng cụ", required: true },
  { name: "symbol", label: "Ký hiệu", mono: true },
  { name: "volume", label: "Dung tích / kích thước", placeholder: "VD: 500 mL" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function Page() {
  const [items, access] = await Promise.all([containerTypeStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  return (
    <LabPage
      title="Danh sách loại dụng cụ lấy mẫu"
      subtitle="Chai, lọ, túi… dùng khi lấy và lưu mẫu; chọn làm dụng cụ lưu mặc định của loại mẫu"
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/container-types" title="Thêm" fields={FIELDS} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="container-types"
        canWrite={canWrite}
        fields={FIELDS}
        headers={["Tên", "Ký hiệu", "Dung tích", "Ghi chú"]}
        rows={items.sort((a, b) => a.name.localeCompare(b.name, "vi")).map((x) => ({ id: x.id, label: x.name, initial: x, cells: [x.name, x.symbol, x.volume, x.note] }))}
      />
    </LabPage>
  );
}
