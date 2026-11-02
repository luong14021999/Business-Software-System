import { LabPage } from "@/components/m2/lab-ui/page";
import { MappingForm, type MappingValue } from "@/components/m2/settings/mapping-form";
import { analyteStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { labMethodStore } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";

/** Trang thêm / sửa chỉ tiêu phụ. */
export async function MappingPage({ id, initial }: { id?: string; initial: MappingValue }) {
  const [types, analytes, methods, access] = await Promise.all([sampleTypeStore.list(), analyteStore.list(), labMethodStore.list(), currentAccess()]);
  return (
    <LabPage title={id ? "Sửa chỉ tiêu phụ" : "Tạo mới Chỉ tiêu phụ"} subtitle={<span className="text-lg text-[#333]">Thông tin chỉ tiêu phụ</span>}>
      <MappingForm
        id={id}
        initial={initial}
        types={types.sort((a, b) => a.name.localeCompare(b.name, "vi")).map((t) => ({ value: t.id, label: t.name }))}
        analytes={analytes.filter((a) => a.active).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "vi")).map((a) => ({ value: a.id, label: a.name, sampleTypeId: a.sampleTypeId }))}
        methods={methods.filter((m) => m.active).map((m) => m.name).sort((a, b) => a.localeCompare(b, "vi"))}
        canWrite={access.can("write.quality")}
      />
    </LabPage>
  );
}
