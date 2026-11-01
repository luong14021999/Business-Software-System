import Link from "next/link";
import { Tractor, PlayCircle, Wheat, Banknote } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { productionLogStore, productionLotStore, seedLotStore, sourceStockStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { facilityStore } from "@/lib/modules/m3/data/genomics";
import { PRODUCTION_STATUSES, QTY_UNITS, SEED_LEVEL_NAMES, productionMetrics } from "@/lib/modules/m3/breeding-rules";
import { fmtVND } from "@/lib/platform/format";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sản xuất giống theo cấp" };

export default async function BreedProductionPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, varieties, seedLots, stocks, logs, facilities] = await Promise.all([productionLotStore.list(), varietyStore.list(), seedLotStore.list(), sourceStockStore.list(), productionLogStore.list(), facilityStore.list()]);
  const varietyById = byId(varieties);
  const seedById = byId(seedLots);
  const stockById = byId(stocks);
  const fields: CrudField[] = [
    { name: "code", label: "Mã lô sản xuất", required: true, mono: true, placeholder: "VD: SX-2026-001" },
    { name: "varietyId", label: "Giống", type: "select", required: true, options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "level", label: "Cấp giống sản xuất ra", type: "select", required: true, options: [...SEED_LEVEL_NAMES] },
    { name: "sourceSeedLotId", label: "Nguồn: lô giống cấp trên (phải cấp cao hơn, đã đạt)", type: "select", full: true, options: refOptions(seedLots, (s) => `${s.code} · ${s.level} · ${s.status}`) },
    { name: "sourceStockId", label: "Hoặc nguồn giống gốc", type: "select", full: true, options: refOptions(stocks, (s) => `${s.code} · ${s.kind} ${s.name}`) },
    { name: "facilityId", label: "Cơ sở sản xuất (bản đồ)", type: "select", options: refOptions(facilities, (f) => `${f.code} · ${f.name}`) },
    { name: "facility", label: "Cơ sở / vị trí (ghi chú thêm)" },
    { name: "season", label: "Vụ / đợt", placeholder: "VD: Vụ Xuân 2027" },
    { name: "scale", label: "Quy mô", type: "number" },
    { name: "scaleUnit", label: "Đơn vị quy mô", type: "select", options: ["ha", "m²", "con bố mẹ", "lồng / ao"] },
    { name: "plannedQty", label: "Sản lượng kế hoạch", type: "number" },
    { name: "actualQty", label: "Sản lượng thực tế", type: "number" },
    { name: "unit", label: "Đơn vị sản phẩm", type: "select", options: [...QTY_UNITS] },
    { name: "survivalPct", label: "Tỷ lệ sống (%)", type: "number", nullable: true },
    { name: "startedAt", label: "Bắt đầu", type: "date" },
    { name: "harvestedAt", label: "Thu hoạch / xuất chuồng", type: "date" },
    { name: "costTotal", label: "Chi phí khác ngoài nhật ký (VND)", type: "number" },
    { name: "status", label: "Trạng thái", type: "select", options: [...PRODUCTION_STATUSES] },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...all].sort((a, b) => b.code.localeCompare(a.code)).filter((p) => matches(query, p.code, p.level, p.season, p.facility, varietyById.get(p.varietyId)?.name));
  const logCost = (id: string) => logs.filter((l) => l.lotId === id).reduce((s, l) => s + l.cost, 0);
  const year = todayISO().slice(0, 4);

  return (
    <>
      <Header title="Sản xuất giống theo cấp" description="Kế hoạch, lô sản xuất, nhật ký, tỷ lệ sống, năng suất, giá thành – nguồn phải ở cấp cao hơn cấp sản xuất ra" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Lô sản xuất", value: all.length, icon: Tractor, accent: "bg-blue-50 text-blue-600" },
            { label: "Đang sản xuất", value: all.filter((p) => p.status === "Đang sản xuất").length, icon: PlayCircle, accent: "bg-amber-50 text-amber-600" },
            { label: `Thu hoạch ${year}`, value: all.filter((p) => (p.harvestedAt || "").startsWith(year)).length, icon: Wheat, accent: "bg-emerald-50 text-emerald-700", hint: "lô" },
            { label: `Chi phí ${year}`, value: fmtVND(all.filter((p) => (p.startedAt || "").startsWith(year)).reduce((s, p) => s + p.costTotal + logCost(p.id), 0)), icon: Banknote, accent: "bg-violet-50 text-violet-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/breed-production" placeholder="Tìm mã, cấp, vụ, cơ sở, giống…" />
        </div>
        <CrudTableCard
          title="Lô sản xuất"
          description="Bấm mã lô để ghi nhật ký sản xuất và xem lô giống thu được"
          endpoint="/api/breed-production-lots"
          entity="breed-production-lots"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/breed-production-lots" title="Thêm lô sản xuất" fields={fields} addLabel="Thêm lô sản xuất" />}
          headers={["Mã / cấp", "Giống · nguồn", "Cơ sở · vụ", "Kế hoạch → thực tế", "Năng suất · giá thành", "Trạng thái"]}
          emptyText={query ? "Không có lô phù hợp" : "Chưa có lô sản xuất"}
          rows={rows.map((p) => {
            const m = productionMetrics(p, logCost(p.id));
            const src = seedById.get(p.sourceSeedLotId);
            const stock = stockById.get(p.sourceStockId);
            return {
              id: p.id,
              label: p.code,
              initial: p,
              cells: [
                <div key="c"><Link href={`/breed-production/${p.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{p.code}</Link><div className="text-[11px] text-muted-foreground">{p.level}</div></div>,
                <div key="v" className="text-xs">{varietyById.get(p.varietyId)?.name ?? "—"}<div className="text-muted-foreground">{src ? `từ ${src.code} (${src.level})` : stock ? `từ ${stock.kind} ${stock.code}` : "chưa ghi nguồn"}</div></div>,
                <div key="f" className="text-xs">{p.facility || "—"}<div className="text-muted-foreground">{p.season} · {p.scale ? `${p.scale} ${p.scaleUnit}` : ""}</div></div>,
                <span key="q" className="text-xs whitespace-nowrap">{p.plannedQty.toLocaleString("vi-VN")} → {p.actualQty.toLocaleString("vi-VN")} {p.unit}{p.survivalPct != null && <div className="text-muted-foreground">sống {p.survivalPct}%</div>}</span>,
                <div key="y" className="text-xs whitespace-nowrap">{m.yieldPerScale != null ? `${m.yieldPerScale.toLocaleString("vi-VN")} ${p.unit}/${p.scaleUnit}` : "—"}<div className="text-muted-foreground">{m.unitCost != null ? `${fmtVND(m.unitCost)}/${p.unit}` : ""}</div></div>,
                <Badge key="s" variant={p.status === "Đã thu hoạch" ? "success" : p.status === "Hủy" ? "destructive" : p.status === "Đang sản xuất" ? "default" : "secondary"}>{p.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
