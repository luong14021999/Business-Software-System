import { LabPage } from "@/components/m2/lab-ui/page";
import { BatchTemplateForm } from "@/components/m2/settings/batch-template-form";
import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { instrumentTypeStore, labMethodStore, type BatchTemplate } from "@/lib/modules/m2/data/settings";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { currentAccess } from "@/lib/platform/data/access";

const byVi = (a: string, b: string) => a.localeCompare(b, "vi");

/** Trang thêm / sửa template mẻ thử nghiệm. */
export async function BatchTemplatePage({ tpl }: { tpl?: BatchTemplate }) {
  const [staff, methods, types, equipment, chemicals, access] = await Promise.all([staffStore.list(), labMethodStore.list(), instrumentTypeStore.list(), equipmentStore.list(), chemicalsStore.list(), currentAccess()]);
  // Thiết bị phân tích: mã thiết bị của phòng thí nghiệm (không mang ra hiện trường), kèm danh sách thiết bị (loại).
  const instruments = [...new Set([...equipment.filter((e) => !e.isField && e.active !== false).map((e) => `${e.code} · ${e.name}`), ...types.filter((t) => !t.isField).map((t) => t.name)])].sort(byVi);
  return (
    <LabPage title={tpl ? "Sửa bản ghi" : "Tạo mới"} subtitle={<span className="text-lg text-[#333]">Thông tin template mẻ thử nghiệm</span>}>
      <BatchTemplateForm
        id={tpl?.id}
        initial={{ name: tpl?.name ?? "", analyst: tpl?.analyst ?? "", method: tpl?.method ?? "", note: tpl?.note ?? "", active: tpl?.active ?? true, instrumentCode: tpl?.instrumentCode ?? "", chemicals: tpl?.chemicals ?? "" }}
        staff={staff.map((s) => s.fullName).filter(Boolean).sort(byVi).map((n) => ({ value: n, label: n }))}
        methods={methods.filter((m) => m.active).map((m) => m.name).sort(byVi).map((n) => ({ value: n, label: n }))}
        instruments={instruments}
        chemicals={chemicals.map((c) => c.name).sort(byVi)}
        canWrite={access.can("results.enter")}
      />
    </LabPage>
  );
}
