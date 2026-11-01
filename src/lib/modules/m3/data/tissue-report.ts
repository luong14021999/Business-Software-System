// M3.1.6 Báo cáo sản xuất – kinh doanh cây giống nuôi cấy mô (dùng chung cho trang và file CSV).
import { cultureBatchStore, lotFeedbackStore, lotSaleStore, seedlingLotStore, seedlingOrderStore, tissueMaterialStore } from "@/lib/modules/m3/data/tissue";
import { loadCosting } from "@/lib/modules/m3/data/costing";
import { orderProgress } from "@/lib/modules/m3/production";
import { lineage } from "@/lib/modules/m3/tissue-rules";
import { marginPct, monthsOf, sumByMonth } from "@/lib/platform/format";
import { pct } from "@/lib/modules/m3/rates";

export async function tissueReport(year: number) {
  const [lots, sales, orders, feedback, batches, materials, costing] = await Promise.all([
    seedlingLotStore.list(),
    lotSaleStore.list(),
    seedlingOrderStore.list(),
    lotFeedbackStore.list(),
    cultureBatchStore.list(),
    tissueMaterialStore.list(),
    loadCosting(),
  ]);
  const y = String(year);
  const months = monthsOf(year);
  const yearLots = lots.filter((l) => (l.acclimatizedAt || "").startsWith(y));
  const yearSales = sales.filter((s) => (s.soldAt || "").startsWith(y));
  const lotById = new Map(lots.map((l) => [l.id, l]));
  const materialById = new Map(materials.map((m) => [m.id, m]));
  const speciesOf = (batchId: string) => {
    const chain = lineage(batchId, batches);
    const m = materialById.get(chain[chain.length - 1]?.materialId ?? "");
    return m ? `${m.species} ${m.variety}`.trim() : "Chưa rõ giống";
  };

  // Theo lô: số cây, sống, đã bán, doanh thu, giá thành, lãi.
  const byLot = lots
    .map((l) => {
      const ls = yearSales.filter((s) => s.lotId === l.id);
      const sold = ls.reduce((s, x) => s + x.quantity, 0);
      const revenue = ls.reduce((s, x) => s + x.quantity * x.unitPrice, 0);
      const c = costing.lotCost(l);
      const cost = c?.perPlant != null ? c.perPlant * sold : null;
      return { code: l.code, species: speciesOf(l.batchId), quantity: l.quantity, survived: l.survived, sold, revenue, perPlant: c?.perPlant ?? null, cost, margin: cost != null ? marginPct(revenue, cost) : null };
    })
    .filter((x) => x.sold > 0 || yearLots.some((l) => l.code === x.code))
    .sort((a, b) => b.revenue - a.revenue);

  // Theo giống.
  const sp = new Map<string, { plants: number; survived: number; sold: number; revenue: number }>();
  for (const l of yearLots) {
    const k = speciesOf(l.batchId);
    const cur = sp.get(k) ?? { plants: 0, survived: 0, sold: 0, revenue: 0 };
    cur.plants += l.quantity;
    cur.survived += l.survived;
    sp.set(k, cur);
  }
  for (const s of yearSales) {
    const lot = lotById.get(s.lotId);
    const k = lot ? speciesOf(lot.batchId) : "Chưa rõ giống";
    const cur = sp.get(k) ?? { plants: 0, survived: 0, sold: 0, revenue: 0 };
    cur.sold += s.quantity;
    cur.revenue += s.quantity * s.unitPrice;
    sp.set(k, cur);
  }
  const bySpecies = [...sp.entries()].map(([species, v]) => ({ species, ...v, survival: pct(v.survived, v.plants) })).sort((a, b) => b.revenue - a.revenue);

  // Đơn hàng có ngày giao trong năm: tỷ lệ giao đúng hạn.
  const dueOrders = orders.filter((o) => (o.dueAt || "").startsWith(y) && o.status !== "Hủy");
  const onTime = dueOrders.filter((o) => orderProgress(o, sales.filter((s) => s.orderId === o.id)).onTime).length;
  const yearFeedback = feedback.filter((f) => (f.receivedAt || "").startsWith(y));
  const rated = yearFeedback.filter((f) => f.rating > 0);

  const revenue = yearSales.reduce((s, x) => s + x.quantity * x.unitPrice, 0);
  const costKnown = byLot.filter((x) => x.cost != null);
  return {
    year,
    months,
    plantsByMonth: sumByMonth(yearLots, (l) => l.acclimatizedAt, (l) => l.quantity, months),
    soldByMonth: sumByMonth(yearSales, (s) => s.soldAt, (s) => s.quantity, months),
    revenueByMonth: sumByMonth(yearSales, (s) => s.soldAt, (s) => s.quantity * s.unitPrice, months),
    totals: {
      plants: yearLots.reduce((s, l) => s + l.quantity, 0),
      survived: yearLots.reduce((s, l) => s + l.survived, 0),
      sold: yearSales.reduce((s, x) => s + x.quantity, 0),
      revenue,
      cost: costKnown.reduce((s, x) => s + (x.cost ?? 0), 0),
      revenueWithCost: costKnown.reduce((s, x) => s + x.revenue, 0),
      dueOrders: dueOrders.length,
      onTime,
      feedback: yearFeedback.length,
      avgRating: rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : null,
    },
    byLot,
    bySpecies,
  };
}
