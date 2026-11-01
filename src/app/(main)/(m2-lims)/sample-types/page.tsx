import { LabPage } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { btn } from "@/components/m2/lab-ui/page";
import { sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { containerTypeStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const fieldsOf = (containers: string[]): CrudField[] => [
  { name: "name", label: "Tên loại mẫu", required: true },
  { name: "prefix", label: "Tiền tố mã mẫu", required: true, mono: true, placeholder: "VD: NM" },
  { name: "sort", label: "Thứ tự", type: "number" },
  { name: "defaultContainer", label: "Dụng cụ lưu mặc định", ...(containers.length ? { type: "select" as const, options: ["", ...containers] } : {}) },
  { name: "active", label: "Đang dùng", type: "bool", boolLabels: ["Đang dùng", "Ngừng dùng"], defaultValue: 1 },
  { name: "description", label: "Mô tả", type: "textarea" },
];

export default async function SampleTypesPage() {
  const [items, access, containers] = await Promise.all([sampleTypeStore.list(), currentAccess(), containerTypeStore.list()]);
  const FIELDS = fieldsOf(containers.map((c) => c.name).sort((a, b) => a.localeCompare(b, "vi")));
  const canWrite = access.can("write.quality");
  return (
    <LabPage
      title="Danh sách loại mẫu"
      subtitle="Tiền tố dùng để sinh mã mẫu khi bóc tách: tiền tố + ngày + số thứ tự, VD NM300726-001"
      toolbar={canWrite && <EntityFormDialog mode="add" endpoint="/api/sample-types" title="Thêm loại mẫu" fields={FIELDS} trigger={<button type="button" className={btn}>Thêm +</button>} />}
    >
      <CatalogTable
        entity="sample-types"
        canWrite={canWrite}
        fields={FIELDS}
        headers={["Tên", "Tiền tố", "Thứ tự", "Dụng cụ lưu mặc định", "Mô tả"]}
        rows={items.sort((a, b) => a.sort - b.sort).map((t) => ({
          id: t.id,
          label: t.name,
          initial: t,
          cells: [<span key="n" className={t.active ? "" : "text-muted-foreground line-through"}>{t.name}</span>, <span key="p" className="font-mono">{t.prefix}</span>, t.sort, t.defaultContainer, t.description],
        }))}
      />
    </LabPage>
  );
}
