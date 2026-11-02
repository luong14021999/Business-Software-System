import { notFound } from "next/navigation";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { XTabs } from "@/components/m2/lab-ui/x-tabs";
import { AnalyteInfo } from "@/components/m2/settings/analyte-info";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { SetDefaultMethod } from "@/components/m2/settings/set-default-method";
import { analyteStore } from "@/lib/modules/m2/data/orders";
import {
  analyteMethodStore,
  analyteResourceStore,
  containerTypeStore,
  instrumentTypeStore,
  labMethodStore,
  preservationStore,
  scopeOptions,
  type ResourceKind,
} from "@/lib/modules/m2/data/settings";
import { samplingContainerStore } from "@/lib/modules/m2/data/catalogs";
import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "thong-tin", label: "Thông tin" },
  { key: "phuong-phap", label: "Phương pháp phân tích" },
  { key: "thiet-bi", label: "Thiết bị quan trắc" },
  { key: "thiet-bi-pt", label: "Thiết bị phân tích" },
  { key: "dung-cu", label: "Dụng cụ lấy mẫu" },
  { key: "bao-quan", label: "Bảo quản" },
  { key: "nguoi-pt", label: "Người phân tích" },
  { key: "hoa-chat", label: "Hoá chất lấy mẫu" },
] as const;
const KIND: Record<string, { kind: ResourceKind; label: string }> = {
  "thiet-bi": { kind: "instrument", label: "Thiết bị quan trắc" },
  "thiet-bi-pt": { kind: "instrument_lab", label: "Thiết bị phân tích" },
  "dung-cu": { kind: "container", label: "Dụng cụ lấy mẫu" },
  "bao-quan": { kind: "preservation", label: "Bảo quản" },
  "nguoi-pt": { kind: "analyst", label: "Người phân tích" },
  "hoa-chat": { kind: "chemical", label: "Hoá chất lấy mẫu" },
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
    body = <AnalyteInfo id={a.id} analyte={a} canWrite={canWrite} />;
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
    const [resources, instrumentTypes, containerTypes, samplingContainers, preservations, staff, chemicals] = await Promise.all([analyteResourceStore.list(), instrumentTypeStore.list(), containerTypeStore.list(), samplingContainerStore.list(), preservationStore.list(), staffStore.list(), chemicalsStore.list()]);
    // Dụng cụ lấy mẫu: ưu tiên danh mục "Nhóm dụng cụ lấy mẫu" (khớp trang Vật tư – hóa chất của đơn), chưa có thì dùng loại dụng cụ.
    const containers = samplingContainers.length ? samplingContainers : containerTypes;
    // Thiết bị quan trắc / phân tích chọn từ Danh sách thiết bị (loại thiết bị) theo ô "Thiết bị quan trắc".
    const instruments = (field: boolean) => {
      const own = instrumentTypes.filter((t) => t.isField === field);
      return (own.length ? own : instrumentTypes).map((t) => t.name);
    };
    const options = {
      instrument: () => instruments(true),
      instrument_lab: () => instruments(false),
      container: () => containers.map((c) => c.name),
      preservation: () => preservations.map((p) => p.name),
      analyst: () => staff.map((s) => s.fullName).filter(Boolean),
      chemical: () => chemicals.map((c) => c.name),
    }[k.kind]();
    const fields: CrudField[] = [{ name: "isDefault", label: "Mặc định", type: "bool", boolLabels: ["Mặc định", "Không"], defaultValue: 0 }];
    body = (
      <>
        {canWrite && (
          <EntityFormDialog
            mode="add"
            endpoint="/api/analyte-resources"
            title={`Thêm ${k.label.toLowerCase()}`}
            fields={[
              { name: "name", label: k.label, type: "select", required: true, full: true, options: [...new Set(options)].sort((x, y) => x.localeCompare(y, "vi")) },
              ...fields,
              { name: "kind", label: "Loại", type: "select", options: [{ value: k.kind, label: k.label }], defaultValue: k.kind },
              { name: "analyteId", label: "Chỉ tiêu", type: "select", options: [{ value: id, label: a.name }], defaultValue: id },
            ]}
            trigger={<button type="button" className={btn}>Chọn {k.label.toLowerCase()} +</button>}
          />
        )}
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

  const href = (k: string) => `/lab-analytes/${id}?tab=${k}`;
  return (
    <LabPage title={a.name} subtitle={<span className="text-lg text-[#333]">Thông tin chỉ tiêu phân tích</span>}>
      <XTabs tabs={TABS.map((t) => ({ label: t.label, href: href(t.key) }))} active={href(active)} />
      <div className="pt-[10px]">{body}</div>
    </LabPage>
  );
}
