import { AnalyteInfoForm } from "@/components/m2/settings/analyte-info-form";
import { calcTemplateStore } from "@/lib/modules/m2/data/calc-methods";
import { industryStore } from "@/lib/modules/m2/data/catalogs";
import { sampleTypeStore, specificationStore, type LabAnalyte } from "@/lib/modules/m2/data/orders";
import { analyteGroupStore, labMethodStore, scopeOptions } from "@/lib/modules/m2/data/settings";
import { specLabel } from "@/lib/modules/m2/orders";

/** Nạp danh mục chọn sẵn rồi hiện form Thông tin chỉ tiêu (thêm mới khi không có `id`). */
export async function AnalyteInfo({ id, analyte, canWrite }: { id?: string; analyte: Omit<LabAnalyte, "id">; canWrite: boolean }) {
  const [types, groups, formulas, specs, scopes, industries, methods] = await Promise.all([
    sampleTypeStore.list(),
    analyteGroupStore.list(),
    calcTemplateStore.list(),
    specificationStore.list(),
    scopeOptions(),
    industryStore.list(),
    labMethodStore.list(),
  ]);
  return (
    <AnalyteInfoForm
      id={id}
      analyte={{ ...analyte, decimals: analyte.decimals ?? {} }}
      canWrite={canWrite}
      types={types.filter((t) => t.active || t.id === analyte.sampleTypeId).map((t) => ({ value: t.id, label: t.name }))}
      groups={groups.sort((x, y) => x.sort - y.sort).map((g) => g.name)}
      formulas={formulas.map((f) => ({ value: f.code, label: `${f.code} · ${f.name}` }))}
      specs={specs.filter((s) => s.active).map((s) => ({ value: s.id, label: specLabel(s), sampleTypeId: s.sampleTypeId }))}
      scopes={scopes}
      industries={industries.map((i) => i.name).sort((a, b) => a.localeCompare(b, "vi"))}
      methods={methods.filter((m) => m.active).map((m) => m.name).sort((a, b) => a.localeCompare(b, "vi"))}
    />
  );
}
