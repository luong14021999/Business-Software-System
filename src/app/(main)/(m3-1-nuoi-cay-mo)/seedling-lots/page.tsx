import Link from "next/link";
import { QrCode, Sprout, HeartPulse, Truck, Printer } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import {
  LOT_GRADES,
  LOT_STATUSES,
  cultureBatchStore,
  lotFeedbackStore,
  lotSaleStore,
  seedlingLotStore,
  seedlingOrderStore,
  tissueMaterialStore,
  type SeedlingLot,
} from "@/lib/modules/m3/data/tissue";
import { loadCosting } from "@/lib/modules/m3/data/costing";
import { lineage } from "@/lib/modules/m3/tissue-rules";
import { fmtPct, pct, survivalRate } from "@/lib/modules/m3/rates";
import { fmtVND } from "@/lib/platform/format";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lô cây giống & vườn ươm" };

const statusVariant: Record<SeedlingLot["status"], "default" | "success" | "secondary" | "destructive"> = {
  "Vườn ươm": "default",
  "Đủ tiêu chuẩn xuất": "success",
  "Đã xuất": "secondary",
  "Hủy": "destructive",
};

export default async function SeedlingLotsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, batches, materials, orders, sales, feedback, costing] = await Promise.all([
    seedlingLotStore.list(),
    cultureBatchStore.list(),
    tissueMaterialStore.list(),
    seedlingOrderStore.list(),
    lotSaleStore.list(),
    lotFeedbackStore.list(),
    loadCosting(),
  ]);
  const batchById = byId(batches);
  const materialById = byId(materials);
  const orderById = byId(orders);
  const today = todayISO();
  const fields: CrudField[] = [
    { name: "code", label: "Mã lô (in trên tem truy xuất)", required: true, mono: true, placeholder: "VD: LO-2026-001" },
    { name: "batchId", label: "Từ mẻ cấy (mẻ ra rễ)", type: "select", options: refOptions(batches, (b) => `${b.code} · ${b.stage}`) },
    { name: "orderId", label: "Phục vụ đơn hàng", type: "select", options: refOptions(orders.filter((o) => o.status !== "Hủy"), (o) => `${o.code} · ${o.species} ${o.variety}`) },
    { name: "acclimatizedAt", label: "Ngày ra ngôi", type: "date" },
    { name: "nurseryBed", label: "Khu / luống vườn ươm" },
    { name: "quantity", label: "Số cây ra ngôi", type: "number" },
    { name: "survived", label: "Số cây sống", type: "number" },
    { name: "grade1Qty", label: "Số cây Loại 1", type: "number" },
    { name: "grade2Qty", label: "Số cây Loại 2", type: "number" },
    { name: "rejectQty", label: "Số cây không đạt", type: "number" },
    { name: "readyAt", label: "Ngày đủ tiêu chuẩn xuất", type: "date" },
    { name: "grade", label: "Phân loại chính (in tem)", type: "select", options: ["", ...LOT_GRADES] },
    { name: "status", label: "Trạng thái", type: "select", options: [...LOT_STATUSES] },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const speciesOf = (l: SeedlingLot) => {
    const chain = lineage(l.batchId, batches);
    const m = materialById.get(chain[chain.length - 1]?.materialId ?? "");
    return m ? `${m.species} ${m.variety}`.trim() : "";
  };
  const soldOf = (id: string) => sales.filter((s) => s.lotId === id).reduce((s, x) => s + x.quantity, 0);
  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => b.code.localeCompare(a.code))
    .filter((x) => matches(query, x.code, x.nurseryBed, batchById.get(x.batchId)?.code, speciesOf(x), orderById.get(x.orderId)?.code));
  const planted = all.reduce((s, x) => s + (x.quantity || 0), 0);
  const survived = all.reduce((s, x) => s + (x.survived || 0), 0);
  const inNursery = all.filter((x) => x.status === "Vườn ươm" || x.status === "Đủ tiêu chuẩn xuất").reduce((s, x) => s + Math.max(0, (x.survived || 0) - soldOf(x.id)), 0);

  return (
    <>
      <Header title="Lô cây giống & vườn ươm" description="Ra ngôi, phân loại chất lượng, giá thành, xuất bán; mỗi lô truy xuất bằng QR đến cây mẹ" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Lô cây giống", value: all.length, icon: QrCode, accent: "bg-blue-50 text-blue-600" },
            { label: "Cây còn trong vườn", value: inNursery.toLocaleString("vi-VN"), icon: Sprout, accent: "bg-emerald-50 text-emerald-700", hint: "sống, chưa xuất" },
            { label: "Tỷ lệ sống chung", value: fmtPct(pct(survived, planted)), icon: HeartPulse, accent: "bg-violet-50 text-violet-600", hint: `${survived}/${planted} cây` },
            { label: "Cây đã xuất", value: sales.reduce((s, x) => s + x.quantity, 0).toLocaleString("vi-VN"), icon: Truck, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        {!costing.ratesConfigured && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Giá thành mới gồm hóa chất môi trường. Đặt đơn giá nhân công, chi phí chung mỗi bình và chi phí vườn ươm mỗi cây ở <Link href="/settings" className="underline">Cấu hình (M1)</Link> để tính đủ.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/lot-labels?codes=${encodeURIComponent(rows.filter((x) => x.status !== "Hủy").map((x) => x.code).join(","))}`}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent"
            >
              <Printer className="w-4 h-4" /> In tem QR ({rows.filter((x) => x.status !== "Hủy").length} lô đang lọc)
            </Link>
            <Link href="/lot-sales" className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent"><Truck className="w-4 h-4" /> Phiếu xuất</Link>
          </div>
          <EntitySearchInput basePath="/seedling-lots" placeholder="Tìm mã lô, mẻ, giống, luống, đơn hàng…" />
        </div>
        <CrudTableCard
          title="Danh sách lô cây giống"
          description="Giá thành / cây sống = (chồi từ mẻ cấy × giá thành chồi + chi phí vườn ươm) ÷ cây sống"
          endpoint="/api/seedling-lots"
          entity="seedling-lots"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/seedling-lots" title="Thêm lô ra ngôi" fields={fields} addLabel="Thêm lô" />}
          headers={["Mã lô / ra ngôi", "Giống · đơn hàng", "Sống · phân loại", "Vườn ươm", "Giá thành / cây", "Đã xuất · phản hồi", "Trạng thái"]}
          emptyText={query ? "Không có lô phù hợp" : "Chưa có lô cây giống nào"}
          rows={rows.map((x) => {
            const c = costing.lotCost(x);
            const sold = soldOf(x.id);
            const fb = feedback.filter((f) => f.lotId === x.id);
            const ready = x.readyAt && x.readyAt <= today;
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c">
                  <Link href={`/trace/${encodeURIComponent(x.code)}`} target="_blank" className="font-mono text-xs font-semibold text-primary hover:underline">{x.code}</Link>
                  <div className="text-[11px] text-muted-foreground">{fmtDateVN(x.acclimatizedAt)} · {batchById.get(x.batchId)?.code ?? "chưa gắn mẻ"}</div>
                </div>,
                <div key="g" className="text-xs">{speciesOf(x) || "—"}<div className="text-muted-foreground font-mono">{orderById.get(x.orderId)?.code ?? ""}</div></div>,
                <div key="s" className="text-xs whitespace-nowrap">
                  {x.survived}/{x.quantity} · {fmtPct(survivalRate(x))}
                  <div className="text-muted-foreground">L1 {x.grade1Qty} · L2 {x.grade2Qty} · loại {x.rejectQty}</div>
                </div>,
                <div key="n" className="text-xs">{x.nurseryBed || "—"}<div className={ready ? "text-emerald-700" : "text-muted-foreground"}>{x.readyAt ? `${ready ? "đủ chuẩn từ" : "dự kiến"} ${fmtDateVN(x.readyAt)}` : ""}</div></div>,
                <span key="p" className="text-xs whitespace-nowrap">{c?.perPlant != null ? fmtVND(c.perPlant) : <span className="text-muted-foreground">chưa đủ dữ liệu</span>}</span>,
                <div key="x" className="text-xs whitespace-nowrap">
                  {sold}/{x.survived} cây
                  {fb.length > 0 && <div className="text-muted-foreground">{fb.length} phản hồi{fb.some((f) => f.status === "Mới") && <span className="text-rose-600"> · có mới</span>}</div>}
                </div>,
                <Badge key="st" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
