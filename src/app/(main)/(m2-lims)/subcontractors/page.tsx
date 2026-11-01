import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { subcontractorStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "name", label: "Tên cơ quan", required: true, full: true },
  { name: "code", label: "Mã / số hiệu công nhận", placeholder: "VD: VILAS 123" },
  { name: "phone", label: "Số điện thoại" },
  { name: "active", label: "Đang dùng", type: "bool", boolLabels: ["Đang dùng", "Ngừng dùng"], defaultValue: 1 },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function Page() {
  const [items, access] = await Promise.all([subcontractorStore.list(), currentAccess()]);
  const canWrite = access.can("write.quality");
  return (
    <LabPage
      title="Danh sách thầu phụ"
      subtitle="Đơn vị bên ngoài thực hiện một số chỉ tiêu; xuất hiện trong cột “Thầu phụ” khi bóc tách và nhập kết quả"
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/subcontractors" title="Thêm" fields={FIELDS} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="subcontractors"
        canWrite={canWrite}
        fields={FIELDS}
        headers={["Tên cơ quan", "Mã / số hiệu công nhận", "Số điện thoại", "Ghi chú"]}
        rows={items.sort((a, b) => a.name.localeCompare(b.name, "vi")).map((x) => ({ id: x.id, label: x.name, initial: x, cells: [<span key="n" className={x.active ? "" : "text-muted-foreground line-through"}>{x.name}</span>, x.code, x.phone, x.note] }))}
      />
    </LabPage>
  );
}
