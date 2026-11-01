import { Search } from "lucide-react";
import { LabPage, Pager, btn, input } from "@/components/m2/lab-ui/page";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { analyteStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { scopeOptions } from "@/lib/modules/m2/data/settings";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtVND, normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";
const PER_PAGE = 25;

export default async function AnalytesPage({ searchParams }: { searchParams: Promise<{ type?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const [items, types, access, scopes] = await Promise.all([analyteStore.list(), sampleTypeStore.list(), currentAccess(), scopeOptions()]);
  const canWrite = access.can("write.quality");
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const fields: CrudField[] = [
    { name: "sampleTypeId", label: "Loại mẫu", type: "select", required: true, options: types.map((t) => ({ value: t.id, label: t.name })) },
    { name: "name", label: "Tên chỉ tiêu", required: true, full: true },
    { name: "groupName", label: "Nhóm chỉ tiêu", placeholder: "VD: Kim loại nặng" },
    { name: "unit", label: "Đơn vị" },
    { name: "method", label: "Phương pháp", full: true },
    { name: "loq", label: "Giới hạn định lượng (LOQ)" },
    { name: "scope", label: "Phạm vi thực hiện", type: "select", options: scopes },
    { name: "unitPrice", label: "Đơn giá tham khảo (đ/mẫu, chưa thuế)", type: "number" },
    { name: "accreditedNo", label: "Số TT phép thử VILAS", type: "number", nullable: true },
    { name: "sort", label: "Thứ tự", type: "number" },
    { name: "active", label: "Đang dùng", type: "bool", boolLabels: ["Đang dùng", "Ngừng dùng"], defaultValue: 1 },
  ];
  const q = normalizeVi(sp.q ?? "");
  const rows = items
    .filter((a) => !sp.type || a.sampleTypeId === sp.type)
    .filter((a) => !q || normalizeVi(`${a.name} ${a.method} ${a.groupName}`).includes(q))
    .sort((a, b) => (typeName.get(a.sampleTypeId) ?? "").localeCompare(typeName.get(b.sampleTypeId) ?? "") || a.sort - b.sort);
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const qs = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams(Object.entries({ type: sp.type, q: sp.q, ...p }).filter(([, v]) => v) as [string, string][]);
    return `/lab-analytes${u.size ? `?${u}` : ""}`;
  };
  return (
    <LabPage
      title="Danh sách chỉ tiêu phân tích"
      subtitle={`${rows.length} chỉ tiêu – dùng khi bóc tách đơn hàng; mỗi chỉ tiêu gắn với một loại mẫu`}
      toolbar={
        <>
          {canWrite && <EntityFormDialog mode="add" endpoint="/api/lab-analytes" title="Thêm chỉ tiêu" fields={fields} trigger={<button type="button" className={btn}>Thêm +</button>} />}
          <Dropdown className={btn} label={`Loại mẫu: ${typeName.get(sp.type ?? "") ?? "Tất cả"}`} items={[{ label: "Tất cả", href: qs({ type: undefined }) }, ...types.map((t) => ({ label: t.name, href: qs({ type: t.id }), active: sp.type === t.id }))]} />
          <form action="/lab-analytes" className="flex">
            {sp.type && <input type="hidden" name="type" value={sp.type} />}
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Tên, phương pháp, nhóm..." className={`${input} w-64 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4" /></button>
          </form>
        </>
      }
    >
      <CatalogTable
        entity="lab-analytes"
        canWrite={canWrite}
        fields={fields}
        headers={["Tên", "Loại mẫu", "Nhóm", "Đơn vị", "Phương pháp", "Phạm vi", "Đơn giá"]}
        rows={rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((a) => ({
          id: a.id,
          label: a.name,
          initial: a,
          cells: [
            <span key="n" className={a.active ? "" : "text-muted-foreground line-through"}>{a.accreditedNo ? `${String(a.accreditedNo).padStart(2, "0")}. ` : ""}{a.name}</span>,
            typeName.get(a.sampleTypeId) ?? "—",
            a.groupName || "—",
            a.unit || "—",
            <span key="m" className="text-xs">{a.method}</span>,
            a.scope,
            <span key="p" className="whitespace-nowrap">{a.unitPrice ? fmtVND(a.unitPrice) : "—"}</span>,
          ],
        }))}
      />
      <Pager page={page} pages={pages} href={(p) => qs({ page: String(p) })} />
    </LabPage>
  );
}
