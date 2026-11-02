import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { AnalyteInfoForm } from "@/components/m2/settings/analyte-info-form";
import { SetDefaultMethod } from "@/components/m2/settings/set-default-method";
import { analyteStore, sampleTypeStore, specificationStore } from "@/lib/modules/m2/data/orders";
import {
  analyteGroupStore,
  analyteMethodStore,
  analyteResourceStore,
  containerTypeStore,
  labMethodStore,
  preservationStore,
  scopeOptions,
  type ResourceKind,
} from "@/lib/modules/m2/data/settings";
import { calcTemplateStore } from "@/lib/modules/m2/data/calc-methods";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { samplingContainerStore } from "@/lib/modules/m2/data/catalogs";
import { specLabel } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "thong-tin", label: "Thông tin" },
  { key: "phuong-phap", label: "Phương pháp phân tích" },
  { key: "thiet-bi", label: "Thiết bị quan trắc / phân tích" },
  { key: "dung-cu", label: "Dụng cụ lấy mẫu" },
  { key: "bao-quan", label: "Bảo quản" },
] as const;
const KIND: Record<string, { kind: ResourceKind; label: string }> = {
  "thiet-bi": { kind: "instrument", label: "Thiết bị" },
  "dung-cu": { kind: "container", label: "Dụng cụ lấy mẫu" },
  "bao-quan": { kind: "preservation", label: "Bảo quản" },
};

/** Thông tin chỉ tiêu phân tích theo từng tab. */
export default async function AnalytePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab = "thong-tin" }] = await Promise.all([params, searchParams]);
  const [analytes, access] = await Promise.all([analyteStore.list(), currentAccess()]);
  const a = analytes.find((x) => x.id === id);
  if (!a) notFound();
  const canWrite = access.can("write.quality");
  const active = TABS.find((t) => t.key === tab)?.key ?? "thong-tin";

  let body: React.ReactNode;
  if (active === "thong-tin") {
    const [types, groups, formulas, specs, scopes] = await Promise.all([sampleTypeStore.list(), analyteGroupStore.list(), calcTemplateStore.list(), specificationStore.list(), scopeOptions()]);
    body = (
      <AnalyteInfoForm
        analyte={a}
        canWrite={canWrite}
        types={types.map((t) => ({ value: t.id, label: t.name }))}
        groups={[...new Set([...groups.sort((x, y) => x.sort - y.sort).map((g) => g.name), ...(a.groupName ? [a.groupName] : [])])]}
        formulas={formulas.map((f) => ({ value: f.code, label: `${f.code} · ${f.name}` }))}
        specs={specs.filter((s) => s.active).map((s) => ({ value: s.id, label: specLabel(s) }))}
        scopes={scopes}
      />
    );
  } else if (active === "phuong-phap") {
    const [methods, catalog, scopes] = await Promise.all([analyteMethodStore.list(), labMethodStore.list(), scopeOptions()]);
    const fields: CrudField[] = [
      { name: "minValue", label: "Giới hạn phát hiện (min)", type: "number", nullable: true },
      { name: "maxValue", label: "Giới hạn phát hiện (max)", type: "number", nullable: true },
      { name: "subcontractor", label: "Thầu phụ", type: "select", options: ["", ...scopes] },
    ];
    body = (
      <>
        {canWrite && (
          <EntityFormDialog
            mode="add"
            endpoint="/api/analyte-methods"
            title="Thêm phương pháp"
            fields={[
              { name: "method", label: "Phương pháp", type: "select", required: true, full: true, options: catalog.filter((m) => m.active).map((m) => m.name).sort() },
              ...fields,
              { name: "isDefault", label: "Mặc định", type: "bool", boolLabels: ["Mặc định", "Không"], defaultValue: 0 },
              { name: "analyteId", label: "Chỉ tiêu", type: "select", options: [{ value: id, label: a.name }], defaultValue: id },
            ]}
            trigger={<button type="button" className={btn}>Thêm phương pháp +</button>}
          />
        )}
        <p className="mt-2 text-xs text-muted-foreground">Kết quả nhỏ hơn min hoặc lớn hơn max bị đánh dấu ⚠ “ngoài giới hạn phương pháp”. Chỉ có min thì để trống max. Danh mục phương pháp ở Cài đặt → Phương pháp phân tích.</p>
        <div className="mt-2">
          <CatalogTable
            entity="analyte-methods"
            canWrite={canWrite}
            fields={fields}
            emptyText="Chưa có phương pháp"
            headers={["Phương pháp", "Mặc định", "Giới hạn phát hiện (min)", "Giới hạn phát hiện (max)", "Thầu phụ"]}
            rows={methods.filter((m) => m.analyteId === id).sort((x, y) => Number(y.isDefault) - Number(x.isDefault) || x.method.localeCompare(y.method)).map((m) => ({
              id: m.id,
              label: m.method,
              initial: m,
              cells: [m.method, <SetDefaultMethod key="d" id={m.id} isDefault={m.isDefault} canWrite={canWrite} />, m.minValue ?? "—", m.maxValue ?? "—", m.subcontractor || "—"],
            }))}
          />
        </div>
      </>
    );
  } else {
    const k = KIND[active];
    const [resources, equipment, containerTypes, samplingContainers, preservations] = await Promise.all([analyteResourceStore.list(), equipmentStore.list(), containerTypeStore.list(), samplingContainerStore.list(), preservationStore.list()]);
    // Dụng cụ lấy mẫu: ưu tiên danh mục "Nhóm dụng cụ lấy mẫu" (khớp trang Vật tư – hóa chất của đơn), chưa có thì dùng loại dụng cụ.
    const containers = samplingContainers.length ? samplingContainers : containerTypes;
    const options = k.kind === "instrument" ? equipment.map((e) => `${e.code} · ${e.name}`) : k.kind === "container" ? containers.map((c) => c.name) : preservations.map((p) => p.name);
    const fields: CrudField[] = [{ name: "isDefault", label: "Mặc định", type: "bool", boolLabels: ["Mặc định", "Không"], defaultValue: 0 }];
    body = (
      <>
        {canWrite && (
          <EntityFormDialog
            mode="add"
            endpoint="/api/analyte-resources"
            title={`Thêm ${k.label.toLowerCase()}`}
            fields={[
              { name: "name", label: k.label, type: "select", required: true, full: true, options: options.sort() },
              ...fields,
              { name: "kind", label: "Loại", type: "select", options: [{ value: k.kind, label: k.label }], defaultValue: k.kind },
              { name: "analyteId", label: "Chỉ tiêu", type: "select", options: [{ value: id, label: a.name }], defaultValue: id },
            ]}
            trigger={<button type="button" className={btn}>Chọn {k.label.toLowerCase()} +</button>}
          />
        )}
        <p className="mt-2 text-xs text-muted-foreground">Dùng khi lập kế hoạch quan trắc (chuẩn bị thiết bị, dụng cụ, bảo quản) và báo cáo môi trường lao động.</p>
        <div className="mt-2">
          <CatalogTable
            entity="analyte-resources"
            canWrite={canWrite}
            fields={fields}
            emptyText="Chưa chọn"
            headers={[k.label, "Mặc định"]}
            rows={resources.filter((r) => r.analyteId === id && r.kind === k.kind).map((r) => ({ id: r.id, label: r.name, initial: r, cells: [r.name, r.isDefault ? "✓" : ""] }))}
          />
        </div>
      </>
    );
  }

  return (
    <LabPage
      title={a.name}
      subtitle="Thông tin chỉ tiêu phân tích"
      toolbar={<Link href="/lab-analytes" className={btn} aria-label="Quay lại danh sách chỉ tiêu"><ArrowLeft className="h-4 w-4" /></Link>}
    >
      <div role="tablist" className="mb-4 flex flex-wrap border-b border-[#ddd]">
        {TABS.map((t) => (
          <Link key={t.key} role="tab" aria-selected={active === t.key} href={`/lab-analytes/${id}?tab=${t.key}`} className={cn("-mb-px rounded-t border px-4 py-2 text-sm", active === t.key ? "border-[#ddd] border-b-white bg-white text-[#555]" : "border-transparent text-[#337ab7] hover:bg-[#eee]")}>
            {t.label}
          </Link>
        ))}
      </div>
      {body}
    </LabPage>
  );
}
