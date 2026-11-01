import { Package, AlertTriangle, Banknote, ArrowDownUp } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { supplyMoveStore, supplyStore } from "@/lib/modules/m3/data/tissue";
import { MOVE_KINDS, SUPPLY_CATEGORIES, stockOf } from "@/lib/modules/m3/production";
import { fmtVND } from "@/lib/platform/format";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kho vật tư nuôi cấy mô" };

const SUPPLY_FIELDS: CrudField[] = [
  { name: "code", label: "Mã vật tư", required: true, mono: true, placeholder: "VD: VT-001" },
  { name: "category", label: "Nhóm", type: "select", options: [...SUPPLY_CATEGORIES] },
  { name: "name", label: "Tên vật tư", required: true, full: true, placeholder: "VD: Sucrose, Agar, BAP, bình thủy tinh 250 ml" },
  { name: "unit", label: "Đơn vị tồn kho / định giá", placeholder: "g, ml, cái…" },
  { name: "unitPrice", label: "Đơn giá (VND / đơn vị)", type: "number" },
  { name: "minStock", label: "Tồn tối thiểu (cảnh báo)", type: "number" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

const fmtQty = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 3 });

export default async function TissueSuppliesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [supplies, moves] = await Promise.all([supplyStore.list(), supplyMoveStore.list()]);
  const supplyById = byId(supplies);
  const stock = new Map(supplies.map((s) => [s.id, stockOf(moves.filter((m) => m.supplyId === s.id))]));
  const moveFields: CrudField[] = [
    { name: "supplyId", label: "Vật tư", type: "select", required: true, options: refOptions(supplies, (s) => `${s.code} · ${s.name} (${s.unit})`) },
    { name: "kind", label: "Loại phiếu", type: "select", options: [...MOVE_KINDS] },
    { name: "movedAt", label: "Ngày", type: "date" },
    { name: "quantity", label: "Số lượng (điều chỉnh: âm để giảm)", type: "number", required: true },
    { name: "unitPrice", label: "Giá nhập (VND / đơn vị) – cập nhật đơn giá", type: "number" },
    { name: "ref", label: "Số phiếu / mã lô môi trường", mono: true },
    { name: "actor", label: "Người lập" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...supplies].sort((a, b) => a.code.localeCompare(b.code)).filter((s) => matches(query, s.code, s.name, s.category));
  const low = supplies.filter((s) => s.minStock > 0 && (stock.get(s.id) ?? 0) < s.minStock);

  return (
    <>
      <Header title="Kho vật tư nuôi cấy mô" description="Hóa chất, bình, giá thể: nhập – xuất – tồn, đơn giá dùng tính giá thành môi trường và lô giống" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Vật tư", value: supplies.length, icon: Package, accent: "bg-blue-50 text-blue-600" },
            { label: "Dưới tồn tối thiểu", value: low.length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600" },
            { label: "Giá trị tồn kho", value: fmtVND(supplies.reduce((s, x) => s + Math.max(0, stock.get(x.id) ?? 0) * x.unitPrice, 0)), icon: Banknote, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Phiếu nhập / xuất", value: moves.length, icon: ArrowDownUp, accent: "bg-violet-50 text-violet-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/tissue-supplies" placeholder="Tìm mã, tên, nhóm vật tư…" />
        </div>
        <CrudTableCard
          title="Vật tư"
          description="Gắn vật tư vào định mức hóa chất (trang công thức môi trường) để tính chi phí môi trường / lít"
          endpoint="/api/tissue-supplies"
          entity="tissue-supplies"
          editFields={SUPPLY_FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/tissue-supplies" title="Thêm vật tư" fields={SUPPLY_FIELDS} addLabel="Thêm vật tư" />}
          headers={["Mã / nhóm", "Tên", "Tồn kho", "Đơn giá", "Giá trị tồn"]}
          emptyText={query ? "Không có vật tư phù hợp" : "Chưa có vật tư"}
          rows={rows.map((s) => {
            const st = stock.get(s.id) ?? 0;
            const isLow = s.minStock > 0 && st < s.minStock;
            return {
              id: s.id,
              label: s.name,
              initial: s,
              cells: [
                <div key="c"><div className="font-mono text-xs font-semibold">{s.code}</div><div className="text-[11px] text-muted-foreground">{s.category}</div></div>,
                <span key="n" className="text-sm">{s.name}</span>,
                <div key="t" className={`text-sm tabular-nums ${isLow ? "text-rose-600 font-medium" : ""}`}>{fmtQty(st)} {s.unit}{isLow && <div className="text-[11px]">dưới mức {fmtQty(s.minStock)}</div>}</div>,
                <span key="p" className="text-xs whitespace-nowrap">{fmtVND(s.unitPrice)} / {s.unit}</span>,
                <span key="v" className="text-xs whitespace-nowrap">{fmtVND(Math.max(0, st) * s.unitPrice)}</span>,
              ],
            };
          })}
        />
        <CrudTableCard
          title="Phiếu nhập / xuất / kiểm kê"
          description="Không xuất quá tồn kho; phiếu sai thì xóa và lập lại (không sửa) để giữ dấu vết"
          endpoint="/api/supply-moves"
          entity="supply-moves"
          editFields={[]}
          addNode={<EntityFormDialog mode="add" endpoint="/api/supply-moves" title="Lập phiếu kho" fields={moveFields} addLabel="Lập phiếu" />}
          headers={["Ngày", "Vật tư", "Loại", "Số lượng", "Giá nhập", "Số phiếu · người lập"]}
          emptyText="Chưa có phiếu kho"
          rows={[...moves].sort((a, b) => (b.movedAt || "").localeCompare(a.movedAt || "")).slice(0, 200).map((m) => {
            const s = supplyById.get(m.supplyId);
            return {
              id: m.id,
              label: `${m.kind} ${s?.code ?? ""}`,
              initial: m,
              cells: [
                <span key="d" className="text-xs whitespace-nowrap">{fmtDateVN(m.movedAt)}</span>,
                <span key="s" className="text-xs">{s ? `${s.code} · ${s.name}` : "—"}</span>,
                <Badge key="k" variant={m.kind === "Nhập" ? "success" : m.kind === "Xuất" ? "secondary" : "warning"}>{m.kind}</Badge>,
                <span key="q" className="text-xs tabular-nums whitespace-nowrap">{m.kind === "Xuất" ? "−" : m.quantity < 0 ? "" : "+"}{fmtQty(m.quantity)} {s?.unit}</span>,
                <span key="p" className="text-xs">{m.unitPrice ? fmtVND(m.unitPrice) : "—"}</span>,
                <span key="r" className="text-xs">{[m.ref, m.actor].filter(Boolean).join(" · ") || "—"}</span>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
