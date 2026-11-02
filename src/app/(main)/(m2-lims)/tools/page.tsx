import { Search } from "lucide-react";
import { toolsStore } from "@/lib/modules/m2/data/tools";
import { supplyStore } from "@/lib/modules/m2/data/supplies";
import { toolUsageLogStore } from "@/lib/modules/m2/data/tool-usage-logs";
import { AddToolDialog } from "@/components/m2/tools/add-tool-dialog";
import { EditToolDialog } from "@/components/m2/tools/edit-tool-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { LabPage, btn, input, table } from "@/components/m2/lab-ui/page";
import { currentAccess } from "@/lib/platform/data/access";
import { permissionForEntity } from "@/lib/platform/permissions";
import { type Tool } from "@/lib/mock-data";

const SUPPLY_FIELDS: CrudField[] = [
  { name: "code", label: "Mã vật tư", required: true, mono: true },
  { name: "name", label: "Tên vật tư", required: true, full: true },
  { name: "unit", label: "Đơn vị tính" },
  { name: "qty", label: "Số lượng tồn", type: "number" },
  { name: "minQty", label: "Tồn tối thiểu", type: "number" },
  { name: "location", label: "Vị trí" },
  { name: "note", label: "Ghi chú", full: true },
];

const TOOL_USAGE_FIELDS: CrudField[] = [
  { name: "itemName", label: "Tên dụng cụ / vật tư", required: true, full: true },
  { name: "qty", label: "Số lượng", type: "number" },
  { name: "unit", label: "Đơn vị tính" },
  { name: "importedAt", label: "Ngày nhập", type: "date" },
  { name: "status", label: "Tình trạng sử dụng" },
  { name: "user", label: "Người sử dụng" },
  { name: "note", label: "Ghi chú", full: true },
];

export const dynamic = "force-dynamic";

/** Màu chữ trạng thái dụng cụ kiểu Bootstrap. */
const STATUS_COLOR: Record<Tool["status"], string> = {
  "Sẵn sàng": "text-[#3c763d]",
  "Đang dùng": "text-[#31708f]",
  Hỏng: "text-[#a94442]",
  "Chờ kiểm định": "text-[#8a6d3b]",
};

/** Dụng cụ – vật tư kiểu XaLab: danh mục dụng cụ (tồn, kiểm định), danh mục vật tư, nhật ký sử dụng. */
export default async function ToolsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, supplies, toolUsageLogs, access] = await Promise.all([toolsStore.list(), supplyStore.list(), toolUsageLogStore.list(), currentAccess()]);
  const query = q.trim().toLowerCase();
  const tools = query
    ? all.filter((t) => [t.code, t.name, t.category, t.location, t.spec].some((x) => x.toLowerCase().includes(query)))
    : all;
  const canTools = access.can(permissionForEntity("tools"));
  const canSupplies = access.can(permissionForEntity("supplies"));
  const canLogs = access.can(permissionForEntity("tool-usage-logs"));
  const h2 = "mb-2 mt-6 text-xl font-medium text-[#333]";

  return (
    <LabPage
      title="Quản lý dụng cụ – vật tư"
      rule={false}
      toolbar={
        <>
          {canTools && <AddToolDialog />}
          <form action="/tools" className="flex">
            <input name="q" defaultValue={q} placeholder="Tìm mã, tên dụng cụ..." aria-label="Tìm kiếm" className={`${input} !w-56 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
          </form>
        </>
      }
    >
      <p className="mb-3 text-sm text-[#555]">
        {all.length} đầu mục dụng cụ · cần kiểm định {all.filter((t) => t.calibrationRequired).length} ·{" "}
        <span className={all.some((t) => t.qty < t.minQty) ? "font-bold text-[#a94442]" : undefined}>tồn dưới mức tối thiểu {all.filter((t) => t.qty < t.minQty).length}</span> · sẵn sàng sử dụng {all.filter((t) => t.status === "Sẵn sàng").length}.
      </p>

      <h2 className={h2}>Danh mục dụng cụ</h2>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr><th>Mã</th><th>Tên dụng cụ</th><th>Phân loại</th><th>Đặc tính</th><th>Tồn</th><th>Tối thiểu</th><th>Vị trí</th><th>Kiểm định</th><th>Trạng thái</th><th /></tr>
          </thead>
          <tbody>
            {tools.length === 0 && <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">{query ? `Không có dụng cụ nào khớp "${query}"` : "Chưa có dụng cụ nào"}</td></tr>}
            {tools.map((t) => (
              <tr key={t.id}>
                <td className="whitespace-nowrap">{t.code}</td>
                <td className="max-w-[240px]">{t.name}</td>
                <td>{t.category}</td>
                <td className="max-w-[220px] text-[#777]">{t.spec}</td>
                <td className={`whitespace-nowrap ${t.qty < t.minQty ? "font-bold text-[#a94442]" : ""}`}>{t.qty} {t.unit}</td>
                <td>{t.minQty}</td>
                <td>{t.location}</td>
                <td className="whitespace-nowrap text-xs">
                  {t.calibrationRequired ? (
                    <>
                      <div className="text-[#777]">Gần nhất: {t.lastCalibration ?? "—"}</div>
                      <div>Kế tiếp: {t.nextCalibration ?? "—"}</div>
                    </>
                  ) : (
                    <span className="text-[#777]">Không yêu cầu</span>
                  )}
                </td>
                <td className={STATUS_COLOR[t.status]}>{t.status}</td>
                <td className="whitespace-nowrap">
                  {canTools && (
                    <div className="flex items-center justify-end gap-1">
                      <EditToolDialog row={t} />
                      <DeleteEntityButton entity="tools" id={t.id} label={t.name} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className={h2}>Danh mục vật tư</h2>
        {canSupplies && <EntityFormDialog mode="add" endpoint="/api/supplies" title="Thêm vật tư" fields={SUPPLY_FIELDS} submitLabel="Lưu" trigger={<button type="button" className={btn}>Thêm vật tư +</button>} />}
      </div>
      <CatalogTable
        entity="supplies"
        canWrite={canSupplies}
        fields={SUPPLY_FIELDS}
        headers={["Mã", "Vật tư", "ĐVT", "Tồn", "Tối thiểu", "Vị trí"]}
        rows={supplies.map((s) => ({
          id: s.id,
          label: s.name,
          initial: s,
          cells: [s.code, s.name, s.unit, <span key="ton" className={s.qty < s.minQty ? "font-bold text-[#a94442]" : undefined}>{s.qty}</span>, s.minQty, s.location],
        }))}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className={h2}>Nhật ký theo dõi sử dụng dụng cụ, vật tư tiêu hao</h2>
        {canLogs && <EntityFormDialog mode="add" endpoint="/api/tool-usage-logs" title="Thêm nhật ký sử dụng" fields={TOOL_USAGE_FIELDS} submitLabel="Lưu" trigger={<button type="button" className={btn}>Thêm nhật ký +</button>} />}
      </div>
      <CatalogTable
        entity="tool-usage-logs"
        canWrite={canLogs}
        fields={TOOL_USAGE_FIELDS}
        headers={["Tên dụng cụ / vật tư", "Số lượng", "Ngày nhập", "Tình trạng", "Người dùng"]}
        rows={toolUsageLogs.map((u) => ({
          id: u.id,
          label: u.itemName,
          initial: u,
          cells: [u.itemName, `${u.qty} ${u.unit}`, u.importedAt, u.status, u.user],
        }))}
      />
    </LabPage>
  );
}
