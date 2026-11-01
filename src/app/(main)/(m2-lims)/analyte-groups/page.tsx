import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { analyteGroupStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Tên nhóm", required: true, full: true },
  { name: "sort", label: "Thứ tự", type: "number" },
  { name: "isMtld", label: "Nhóm môi trường lao động (NĐ 44)", type: "bool", boolLabels: ["Có", "Không"], defaultValue: 0 },
];

export default async function Page() {
  const [items, access] = await Promise.all([analyteGroupStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  return (
    <LabPage
      title="Danh sách nhóm chỉ tiêu phân tích"
      subtitle="Phân nhóm chỉ tiêu (vi sinh, kim loại nặng…). 7 nhóm môi trường lao động giữ đúng tên để báo cáo theo Nghị định 44/2016/NĐ-CP xếp đúng mục."
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/analyte-groups" title="Thêm" fields={FIELDS} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="analyte-groups"
        canWrite={canWrite}
        fields={FIELDS}
        headers={["Tên", "Thứ tự", "Nhóm môi trường lao động"]}
        rows={items.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "vi")).map((x) => ({ id: x.id, label: x.name, initial: x, cells: [x.name, x.sort, x.isMtld ? "✓" : ""] }))}
      />
    </LabPage>
  );
}
