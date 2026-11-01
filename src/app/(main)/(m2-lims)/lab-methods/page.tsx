import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { labMethodStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Tên phương pháp", required: true, full: true, placeholder: "VD: TCVN 6492:2011" },
  { name: "description", label: "Mô tả", type: "textarea" },
  { name: "active", label: "Đang dùng", type: "bool", boolLabels: ["Đang dùng", "Ngừng dùng"], defaultValue: 1 },
];

export default async function Page() {
  const [items, access] = await Promise.all([labMethodStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  return (
    <LabPage
      title="Danh sách phương pháp phân tích"
      subtitle="Phương pháp thử / quan trắc; gắn cho chỉ tiêu ở trang chi tiết chỉ tiêu (một chỉ tiêu có thể có nhiều phương pháp)"
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/lab-methods" title="Thêm" fields={FIELDS} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="lab-methods"
        canWrite={canWrite}
        fields={FIELDS}
        headers={["Tên", "Mô tả"]}
        rows={items.sort((a, b) => a.name.localeCompare(b.name, "vi")).map((x) => ({ id: x.id, label: x.name, initial: x, cells: [<span key="n" className={x.active ? "" : "text-muted-foreground line-through"}>{x.name}</span>, x.description] }))}
      />
    </LabPage>
  );
}
