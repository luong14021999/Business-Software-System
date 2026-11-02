import { LabPage } from "@/components/m2/lab-ui/page";
import { BulkTemplateForm } from "@/components/m2/settings/bulk-template-form";
import { analyteStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { analyteGroupStore, type BulkTemplate } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

/** Trang thêm / sửa template bóc tách. */
export async function BulkTemplatePage({ tpl }: { tpl?: BulkTemplate }) {
  const [types, groups, analytes, access] = await Promise.all([sampleTypeStore.list(), analyteGroupStore.list(), analyteStore.list(), currentAccess()]);
  return (
    <LabPage title={tpl ? `Sửa bản ghi ${tpl.name}` : "Tạo mới"} subtitle={<span className="text-lg text-[#333]">Thông tin template</span>}>
      <BulkTemplateForm
        id={tpl?.id}
        initial={{ name: tpl?.name ?? "", sampleTypeId: tpl?.sampleTypeId ?? "", description: tpl?.description ?? "", active: tpl?.active ?? true, lines: tpl?.lines ?? [] }}
        types={types.filter((t) => t.active || t.id === tpl?.sampleTypeId).map((t) => ({ value: t.id, label: t.name }))}
        groups={groups.sort((a, b) => a.sort - b.sort).map((g) => g.name)}
        analytes={analytes.filter((a) => a.active).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "vi")).map((a) => ({ name: a.name, sampleTypeId: a.sampleTypeId, groupName: a.groupName, unit: a.unit, method: a.method }))}
        canWrite={access.can("write.reception")}
      />
    </LabPage>
  );
}
