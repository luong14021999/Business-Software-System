import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { LinkList } from "@/components/m3/link-list";
import { productionLogStore, productionLotStore, seedLotStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { LOG_ACTIVITIES, productionMetrics } from "@/lib/modules/m3/breeding-rules";
import { fmtVND } from "@/lib/platform/format";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lô sản xuất giống" };

/** Lô sản xuất (M3.2.6): nhật ký, chỉ số năng suất – giá thành, lô giống thu được. */
export default async function BreedProductionLotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lots, logs, seedLots, varieties] = await Promise.all([productionLotStore.list(), productionLogStore.list(), seedLotStore.list(), varietyStore.list()]);
  const p = lots.find((x) => x.id === id);
  if (!p) notFound();
  const myLogs = logs.filter((l) => l.lotId === id).sort((a, b) => (b.loggedAt || "").localeCompare(a.loggedAt || ""));
  const logCost = myLogs.reduce((s, l) => s + l.cost, 0);
  const m = productionMetrics(p, logCost);
  const fields: CrudField[] = [
    { name: "lotId", label: "Lô sản xuất", type: "select", options: [{ value: p.id, label: p.code }], defaultValue: p.id },
    { name: "loggedAt", label: "Ngày", type: "date" },
    { name: "activity", label: "Công việc", type: "select", options: [...LOG_ACTIVITIES] },
    { name: "detail", label: "Nội dung (vật tư, liều lượng, diện tích, số con…)", type: "textarea", required: true },
    { name: "cost", label: "Chi phí (VND)", type: "number" },
    { name: "actor", label: "Người thực hiện" },
  ];

  return (
    <>
      <Header title={`Lô sản xuất ${p.code}`} description={`${varieties.find((v) => v.id === p.varietyId)?.name ?? "—"} · ${p.level} · ${p.season} · ${p.facility}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/breed-production" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Sản xuất giống
        </Link>
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["Sản lượng", `${p.actualQty.toLocaleString("vi-VN")} ${p.unit}`, `kế hoạch ${p.plannedQty.toLocaleString("vi-VN")}`],
            ["Năng suất", m.yieldPerScale != null ? `${m.yieldPerScale.toLocaleString("vi-VN")}` : "—", `${p.unit} / ${p.scaleUnit}`],
            ["Tỷ lệ sống", p.survivalPct != null ? `${p.survivalPct}%` : "—", ""],
            ["Giá thành", m.unitCost != null ? fmtVND(m.unitCost) : "—", `tổng chi ${fmtVND(m.cost)} / ${p.unit}`],
          ].map(([label, value, hint]) => (
            <Card key={label}><CardContent className="p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-semibold mt-1">{value}</div><div className="text-[11px] text-muted-foreground">{hint}</div></CardContent></Card>
          ))}
        </section>
        <CrudTableCard
          title="Nhật ký sản xuất"
          description={`Chi phí trong nhật ký: ${fmtVND(logCost)} – cộng với chi phí khác của lô để tính giá thành`}
          endpoint="/api/breed-production-logs"
          entity="breed-production-logs"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/breed-production-logs" title="Ghi nhật ký" fields={fields} addLabel="Ghi nhật ký" />}
          headers={["Ngày", "Công việc", "Nội dung", "Chi phí", "Người thực hiện"]}
          emptyText="Chưa có nhật ký"
          rows={myLogs.map((l) => ({
            id: l.id,
            label: l.activity,
            initial: l,
            cells: [
              <span key="d" className="text-xs whitespace-nowrap">{fmtDateVN(l.loggedAt)}</span>,
              <span key="a" className="text-xs">{l.activity}</span>,
              <span key="c" className="text-sm whitespace-pre-line">{l.detail}</span>,
              <span key="m" className="text-xs whitespace-nowrap">{l.cost ? fmtVND(l.cost) : "—"}</span>,
              <span key="p" className="text-xs">{l.actor || "—"}</span>,
            ],
          }))}
        />
        <Card>
          <CardHeader><CardTitle>Lô giống thu được</CardTitle></CardHeader>
          <CardContent><LinkList items={seedLots.filter((s) => s.productionLotId === id).map((s) => ({ key: s.id, href: `/seed-lots/${s.id}`, code: s.code, text: `${s.level} · ${s.quantity.toLocaleString("vi-VN")} ${s.unit} · ${s.status}` }))} empty="Chưa có – thêm ở trang Lô giống, chọn lô sản xuất này" /></CardContent>
        </Card>
      </main>
    </>
  );
}
