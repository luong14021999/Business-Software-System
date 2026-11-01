import { Truck, Banknote, Users, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/header";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { LOT_GRADES, lotSaleStore, seedlingLotStore, seedlingOrderStore } from "@/lib/modules/m3/data/tissue";
import { loadCosting } from "@/lib/modules/m3/data/costing";
import { fmtVND, marginPct } from "@/lib/platform/format";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Xuất bán cây giống" };

export default async function LotSalesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, lots, orders, customers, costing] = await Promise.all([lotSaleStore.list(), seedlingLotStore.list(), seedlingOrderStore.list(), getCustomers(), loadCosting()]);
  const lotById = byId(lots);
  const orderById = byId(orders);
  const customerById = byId(customers);
  const fields: CrudField[] = [
    { name: "code", label: "Số phiếu xuất", required: true, mono: true, placeholder: "VD: PX-2026-001" },
    { name: "lotId", label: "Lô cây giống", type: "select", required: true, options: refOptions(lots.filter((l) => l.status !== "Hủy"), (l) => `${l.code} · ${l.survived} cây sống`) },
    { name: "orderId", label: "Theo đơn hàng", type: "select", options: refOptions(orders.filter((o) => o.status !== "Hủy"), (o) => `${o.code} · ${o.quantity} cây`) },
    { name: "customerId", label: "Khách hàng (trống = lấy theo đơn hàng)", type: "select", options: refOptions(customers, (c) => `${c.code} · ${c.name}`) },
    { name: "soldAt", label: "Ngày xuất", type: "date" },
    { name: "quantity", label: "Số cây", type: "number", required: true },
    { name: "grade", label: "Loại", type: "select", options: [...LOT_GRADES] },
    { name: "unitPrice", label: "Đơn giá (VND / cây; trống = theo đơn hàng)", type: "number" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => (b.soldAt || "").localeCompare(a.soldAt || "") || b.code.localeCompare(a.code))
    .filter((s) => matches(query, s.code, lotById.get(s.lotId)?.code, orderById.get(s.orderId)?.code, customerById.get(s.customerId)?.name));
  const year = todayISO().slice(0, 4);
  const inYear = all.filter((s) => (s.soldAt || "").startsWith(year));
  const revenue = inYear.reduce((s, x) => s + x.quantity * x.unitPrice, 0);
  const cost = inYear.reduce((s, x) => {
    const lot = lotById.get(x.lotId);
    const c = lot ? costing.lotCost(lot) : null;
    return s + (c?.perPlant ?? 0) * x.quantity;
  }, 0);
  const margin = marginPct(revenue, cost);

  return (
    <>
      <Header title="Xuất bán cây giống" description="Phiếu xuất theo lô và đơn hàng – không xuất quá số cây sống còn lại của lô" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: `Cây đã xuất ${year}`, value: inYear.reduce((s, x) => s + x.quantity, 0).toLocaleString("vi-VN"), icon: Truck, accent: "bg-blue-50 text-blue-600" },
            { label: `Doanh thu ${year}`, value: fmtVND(revenue), icon: Banknote, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Khách hàng", value: new Set(inYear.map((s) => s.customerId).filter(Boolean)).size, icon: Users, accent: "bg-violet-50 text-violet-600" },
            { label: "Tỷ suất lợi nhuận", value: margin == null ? "—" : `${margin.toLocaleString("vi-VN")}%`, icon: TrendingUp, accent: "bg-amber-50 text-amber-600", hint: cost ? `giá thành ${fmtVND(cost)}` : "chưa tính được giá thành" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/lot-sales" placeholder="Tìm số phiếu, lô, đơn hàng, khách hàng…" />
        </div>
        <CrudTableCard
          title="Phiếu xuất"
          description="Doanh thu và lãi tính theo đơn giá phiếu xuất và giá thành / cây của lô"
          endpoint="/api/lot-sales"
          entity="lot-sales"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/lot-sales" title="Lập phiếu xuất" fields={fields} addLabel="Lập phiếu xuất" />}
          headers={["Số phiếu / ngày", "Lô", "Đơn hàng · khách", "Số cây", "Thành tiền", "Giá thành"]}
          emptyText={query ? "Không có phiếu phù hợp" : "Chưa có phiếu xuất"}
          rows={rows.map((s) => {
            const lot = lotById.get(s.lotId);
            const per = lot ? costing.lotCost(lot)?.perPlant ?? null : null;
            return {
              id: s.id,
              label: s.code,
              initial: s,
              cells: [
                <div key="c"><div className="font-mono text-xs font-semibold">{s.code}</div><div className="text-[11px] text-muted-foreground">{fmtDateVN(s.soldAt)}</div></div>,
                <span key="l" className="font-mono text-xs">{lot?.code ?? "—"}</span>,
                <div key="o" className="text-xs"><span className="font-mono">{orderById.get(s.orderId)?.code ?? "—"}</span><div className="text-muted-foreground">{customerById.get(s.customerId)?.name ?? ""}</div></div>,
                <span key="q" className="text-xs whitespace-nowrap">{s.quantity.toLocaleString("vi-VN")} · {s.grade}</span>,
                <div key="v" className="text-xs whitespace-nowrap font-medium">{fmtVND(s.quantity * s.unitPrice)}<div className="text-muted-foreground font-normal">{fmtVND(s.unitPrice)}/cây</div></div>,
                <span key="g" className="text-xs whitespace-nowrap">{per != null ? `${fmtVND(per * s.quantity)}` : "—"}</span>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
