import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, ClipboardCheck, NotebookPen, PackageCheck, Play, Repeat, Sprout, Tractor, Truck, Wheat } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { WorkBoard, type WorkCard, type WorkColumn } from "@/components/common/work-board";
import { facilityStore } from "@/lib/modules/m3/data/genomics";
import {
  BREED_KINDS,
  breedOrderStore,
  breedStandardStore,
  deliveryStore,
  productionLotStore,
  seedLotStore,
  varietyStore,
  type ProductionLot,
  type SeedLot,
} from "@/lib/modules/m3/data/breeding";
import { FIELD_RESULTS, LOG_ACTIVITIES, QTY_UNITS, SEED_LEVEL_NAMES, validityAlert } from "@/lib/modules/m3/breeding-rules";
import { nextLevel, seedLotLeft } from "@/lib/modules/m3/breed-workspace";
import { suggestCode } from "@/lib/modules/m3/bench";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { currentAccess } from "@/lib/platform/data/access";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bàn sản xuất giống" };

const vn = (x: number) => (Number(x) || 0).toLocaleString("vi-VN");
const small = (icon: ReactNode, label: string, primary = false) => (
  <Button type="button" size="sm" variant={primary ? "default" : "outline"} className="h-7 gap-1 px-2 text-[11px]">
    {icon}
    {label}
  </Button>
);

/** M3.2.4–M3.2.6 – bàn làm việc: lô sản xuất theo cấp → thu hoạch → lô giống → kiểm định → chứng nhận → cung ứng. */
export default async function SeedWorkbenchPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams;
  const kind = (BREED_KINDS as readonly string[]).includes(sp.kind ?? "") ? sp.kind! : "";
  const [varieties, prodLots, seedLots, deliveries, orders, standards, facilities, customers, access] = await Promise.all([
    varietyStore.list(),
    productionLotStore.list(),
    seedLotStore.list(),
    deliveryStore.list(),
    breedOrderStore.list(),
    breedStandardStore.list(),
    facilityStore.list().catch(() => []),
    getCustomers(),
    currentAccess(),
  ]);
  const today = todayISO();
  const varietyById = byId(varieties);
  const customerById = byId(customers);
  const canWrite = access.can("write.breeding");
  const ofKind = (varietyId: string) => !kind || varietyById.get(varietyId)?.kind === kind;
  const vName = (id: string) => varietyById.get(id)?.name ?? "Chưa rõ giống";
  const prodCodes = prodLots.map((l) => l.code);
  const seedCodes = seedLots.map((l) => l.code);
  const deliveryCodes = deliveries.map((d) => d.code);
  const seedLotsOfProd = new Set(seedLots.map((s) => s.productionLotId).filter(Boolean));
  const deliveredOf = (orderId: string) => deliveries.filter((d) => d.orderId === orderId).reduce((s, d) => s + (Number(d.quantity) || 0), 0);
  const actions = (node: ReactNode) => (canWrite ? node : undefined);

  // ── Lô sản xuất ────────────────────────────────────────────────────
  const logFields = (l: ProductionLot): CrudField[] => [
    { name: "lotId", label: "Lô sản xuất", type: "select", options: [{ value: l.id, label: l.code }] },
    { name: "loggedAt", label: "Ngày", type: "date" },
    { name: "activity", label: "Công việc", type: "select", options: [...LOG_ACTIVITIES] },
    { name: "detail", label: "Nội dung", type: "textarea", required: true },
    { name: "cost", label: "Chi phí (VND)", type: "number" },
    { name: "actor", label: "Người thực hiện" },
  ];
  const harvestFields: CrudField[] = [
    { name: "status", label: "Trạng thái", type: "select", options: ["Đang sản xuất", "Đã thu hoạch"] },
    { name: "harvestedAt", label: "Ngày thu hoạch", type: "date" },
    { name: "actualQty", label: "Sản lượng thực tế", type: "number" },
    { name: "unit", label: "Đơn vị", type: "select", options: [...QTY_UNITS] },
    { name: "survivalPct", label: "Tỷ lệ sống / nảy mầm (%)", type: "number", nullable: true },
    { name: "costTotal", label: "Tổng chi phí (VND)", type: "number" },
  ];
  const prodCard = (l: ProductionLot): WorkCard => {
    const started = l.status === "Đang sản xuất";
    return {
      id: l.id,
      code: l.code,
      href: `/breed-production/${l.id}`,
      title: vName(l.varietyId),
      facts: [l.level, l.season, l.facility || facilities.find((f) => f.id === l.facilityId)?.name || "", l.scale ? `${vn(l.scale)} ${l.scaleUnit}` : "", l.plannedQty ? `KH ${vn(l.plannedQty)} ${l.unit}` : ""],
      due: started && l.startedAt ? { label: `bắt đầu ${fmtDateVN(l.startedAt)}`, tone: "muted" } : l.startedAt ? { label: `dự kiến ${fmtDateVN(l.startedAt)}`, tone: daysUntil(l.startedAt) < 0 ? "red" : "muted" } : undefined,
      actions: actions(
        started ? (
          <>
            <EntityFormDialog mode="add" endpoint="/api/breed-production-logs" title={`Nhật ký – ${l.code}`} fields={logFields(l)} initial={{ lotId: l.id, loggedAt: today }} successText="Đã ghi nhật ký" trigger={small(<NotebookPen />, "Nhật ký")} />
            <EntityFormDialog mode="edit" endpoint="/api/breed-production-lots" id={l.id} title={`Thu hoạch – ${l.code}`} fields={harvestFields} initial={{ ...l, status: "Đã thu hoạch", harvestedAt: today, actualQty: l.actualQty || l.plannedQty }} successText="Đã ghi thu hoạch" trigger={small(<Wheat />, "Thu hoạch", true)} />
          </>
        ) : (
          <EntityFormDialog mode="edit" endpoint="/api/breed-production-lots" id={l.id} title={`Bắt đầu sản xuất – ${l.code}`} fields={[{ name: "status", label: "Trạng thái", type: "select", options: ["Kế hoạch", "Đang sản xuất"] }, { name: "startedAt", label: "Ngày bắt đầu", type: "date" }, { name: "facility", label: "Nơi sản xuất" }]} initial={{ ...l, status: "Đang sản xuất", startedAt: l.startedAt || today }} successText="Đã bắt đầu" trigger={small(<Play />, "Bắt đầu", true)} />
        ),
      ),
    };
  };
  const producing = prodLots.filter((l) => (l.status === "Kế hoạch" || l.status === "Đang sản xuất") && ofKind(l.varietyId)).sort((a, b) => (a.startedAt || "9999").localeCompare(b.startedAt || "9999"));

  // ── Đã thu hoạch, chưa lập lô giống ────────────────────────────────
  const standardOptions = refOptions(standards, (s) => `${s.code} · ${s.name}`);
  const seedLotFields: CrudField[] = [
    { name: "code", label: "Mã lô giống", required: true, mono: true },
    { name: "productionLotId", label: "Từ lô sản xuất", type: "select", options: refOptions(prodLots, (l) => l.code) },
    { name: "varietyId", label: "Giống", type: "select", options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "level", label: "Cấp giống", type: "select", options: [...SEED_LEVEL_NAMES] },
    { name: "quantity", label: "Khối lượng / số lượng", type: "number", required: true },
    { name: "unit", label: "Đơn vị", type: "select", options: [...QTY_UNITS] },
    { name: "producedAt", label: "Ngày sản xuất", type: "date" },
    { name: "standardId", label: "Bộ chỉ tiêu chất lượng", type: "select", options: standardOptions },
  ];
  const harvested = prodLots.filter((l) => l.status === "Đã thu hoạch" && !seedLotsOfProd.has(l.id) && ofKind(l.varietyId)).sort((a, b) => (a.harvestedAt || "").localeCompare(b.harvestedAt || ""));
  const harvestedCards: WorkCard[] = harvested.map((l) => ({
    id: l.id,
    code: l.code,
    href: `/breed-production/${l.id}`,
    title: vName(l.varietyId),
    facts: [l.level, l.harvestedAt ? `thu ${fmtDateVN(l.harvestedAt)}` : "", `${vn(l.actualQty)} ${l.unit}`],
    metric: l.plannedQty ? { label: `Đạt ${Math.round((l.actualQty / l.plannedQty) * 100)}% kế hoạch`, tone: l.actualQty >= l.plannedQty ? "green" : "amber" } : null,
    actions: actions(
      <EntityFormDialog mode="add" endpoint="/api/seed-lots" title={`Lập lô giống từ ${l.code}`} description="Lô mới ở trạng thái Chờ kiểm định." fields={seedLotFields} initial={{ code: suggestCode(l.code.replace(/^SX/, "LG"), seedCodes), productionLotId: l.id, varietyId: l.varietyId, level: l.level, quantity: l.actualQty, unit: l.unit, producedAt: l.harvestedAt || today }} successText="Đã lập lô giống" trigger={small(<PackageCheck />, "Lập lô giống", true)} />,
    ),
  }));

  // ── Lô giống ───────────────────────────────────────────────────────
  const inspectFields: CrudField[] = [
    { name: "sampleCode", label: "Mã mẫu kiểm nghiệm", mono: true },
    { name: "fieldInspectedAt", label: "Ngày kiểm định đồng ruộng", type: "date" },
    { name: "fieldResult", label: "Kết quả kiểm định", type: "select", options: [...FIELD_RESULTS] },
    { name: "status", label: "Trạng thái lô", type: "select", options: ["Chờ kiểm định", "Đạt", "Không đạt"] },
    { name: "standardId", label: "Bộ chỉ tiêu", type: "select", options: standardOptions },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const certFields: CrudField[] = [
    { name: "certificateNo", label: "Số giấy chứng nhận", required: true, mono: true },
    { name: "certifiedAt", label: "Ngày cấp", type: "date", required: true },
    { name: "conformityNo", label: "Số công bố hợp quy", mono: true },
    { name: "conformityUntil", label: "Hợp quy có hiệu lực đến", type: "date" },
    { name: "status", label: "Trạng thái", type: "select", options: ["Đạt", "Đã chứng nhận"] },
  ];
  const seedCard = (s: SeedLot, mode: "inspect" | "certify" | "supply"): WorkCard => {
    const left = seedLotLeft(s, deliveries);
    const alert = validityAlert(s.conformityUntil, today);
    const openOrders = orders.filter((o) => o.varietyId === s.varietyId && (o.status === "Mới" || o.status === "Đã xác nhận" || o.status === "Giao một phần"));
    return {
      id: s.id,
      code: s.code,
      href: `/seed-lots/${s.id}`,
      title: vName(s.varietyId),
      facts: [s.level, `${vn(mode === "supply" ? left : s.quantity)}${mode === "supply" ? `/${vn(s.quantity)}` : ""} ${s.unit}`, s.producedAt ? `SX ${fmtDateVN(s.producedAt)}` : "", s.certificateNo ? `GCN ${s.certificateNo}` : "", s.sampleCode ? `mẫu ${s.sampleCode}` : ""],
      metric: mode === "supply" ? { label: `Còn ${vn(left)} ${s.unit} · ${openOrders.length} đơn đang mở cùng giống`, tone: left > 0 ? "green" : "muted" } : mode === "certify" ? { label: `Kiểm định ${s.fieldResult}${s.fieldInspectedAt ? ` · ${fmtDateVN(s.fieldInspectedAt)}` : ""}`, tone: "green" } : null,
      due: alert ? { label: alert.kind === "Hết hiệu lực" ? `hợp quy hết hạn ${alert.days} ngày` : `hợp quy còn ${alert.days} ngày`, tone: alert.kind === "Hết hiệu lực" ? "red" : "amber" } : undefined,
      actions: actions(
        mode === "inspect" ? (
          <EntityFormDialog mode="edit" endpoint="/api/seed-lots" id={s.id} title={`Kiểm định lô ${s.code}`} fields={inspectFields} initial={{ ...s, fieldInspectedAt: s.fieldInspectedAt || today, fieldResult: s.fieldResult === "Chưa kiểm định" ? "Đạt" : s.fieldResult, status: "Đạt" }} successText="Đã ghi kiểm định" trigger={small(<ClipboardCheck />, "Ghi kiểm định", true)} />
        ) : mode === "certify" ? (
          <EntityFormDialog mode="edit" endpoint="/api/seed-lots" id={s.id} title={`Cấp chứng nhận lô ${s.code}`} fields={certFields} initial={{ ...s, certifiedAt: s.certifiedAt || today, status: "Đã chứng nhận" }} successText="Đã cấp chứng nhận" trigger={small(<BadgeCheck />, "Chứng nhận", true)} />
        ) : (
          <>
            {left > 0 && (
              <EntityFormDialog
                mode="add"
                endpoint="/api/breed-deliveries"
                title={`Giao giống từ lô ${s.code}`}
                description={`Còn ${vn(left)} ${s.unit}. Chỉ giao lô đạt / đã chứng nhận, còn hiệu lực hợp quy.`}
                fields={[
                  { name: "code", label: "Số phiếu giao", required: true, mono: true },
                  { name: "orderId", label: "Đơn hàng", type: "select", options: [{ value: "", label: "— Không theo đơn —" }, ...openOrders.map((o) => ({ value: o.id, label: `${o.code} · ${customerById.get(o.customerId)?.name ?? ""} · còn ${vn(Math.max(0, o.quantity - deliveredOf(o.id)))} ${o.unit}` }))] },
                  { name: "seedLotId", label: "Lô giống", type: "select", options: [{ value: s.id, label: s.code }] },
                  { name: "deliveredAt", label: "Ngày giao", type: "date" },
                  { name: "quantity", label: `Số lượng (${s.unit})`, type: "number", required: true },
                  { name: "receiver", label: "Người nhận" },
                  { name: "note", label: "Ghi chú", type: "textarea" },
                ]}
                initial={{ code: suggestCode(`PG-${s.code}`, deliveryCodes), orderId: openOrders[0]?.id ?? "", seedLotId: s.id, deliveredAt: today, quantity: openOrders[0] ? Math.min(left, Math.max(0, openOrders[0].quantity - deliveredOf(openOrders[0].id))) || left : left }}
                successText="Đã lập phiếu giao"
                trigger={small(<Truck />, "Giao giống", true)}
              />
            )}
            {nextLevel(s.level) !== s.level && (
              <EntityFormDialog
                mode="add"
                endpoint="/api/breed-production-lots"
                title={`Nhân cấp tiếp từ lô ${s.code}`}
                description={`Sản xuất ${nextLevel(s.level)} từ ${s.level}; lô nguồn phải đạt kiểm định.`}
                fields={[
                  { name: "code", label: "Mã lô sản xuất", required: true, mono: true },
                  { name: "varietyId", label: "Giống", type: "select", options: [{ value: s.varietyId, label: vName(s.varietyId) }] },
                  { name: "sourceSeedLotId", label: "Lô giống nguồn", type: "select", options: [{ value: s.id, label: s.code }] },
                  { name: "level", label: "Cấp sản xuất ra", type: "select", options: [...SEED_LEVEL_NAMES] },
                  { name: "season", label: "Vụ / đợt" },
                  { name: "facility", label: "Nơi sản xuất" },
                  { name: "facilityId", label: "Cơ sở (bản đồ)", type: "select", options: refOptions(facilities, (f) => `${f.code} · ${f.name}`) },
                  { name: "scale", label: "Quy mô", type: "number" },
                  { name: "scaleUnit", label: "Đơn vị quy mô", placeholder: "ha, con, cây" },
                  { name: "plannedQty", label: "Sản lượng kế hoạch", type: "number" },
                  { name: "unit", label: "Đơn vị sản lượng", type: "select", options: [...QTY_UNITS] },
                  { name: "startedAt", label: "Ngày bắt đầu dự kiến", type: "date" },
                ]}
                initial={{ code: suggestCode(`SX-${s.code}`, prodCodes), varietyId: s.varietyId, sourceSeedLotId: s.id, level: nextLevel(s.level), unit: s.unit, scaleUnit: "ha", status: "Kế hoạch" }}
                successText="Đã lập kế hoạch sản xuất"
                trigger={small(<Repeat />, "Nhân tiếp")}
              />
            )}
          </>
        ),
      ),
    };
  };
  const lotsOf = (pred: (s: SeedLot) => boolean) => seedLots.filter((s) => pred(s) && ofKind(s.varietyId)).sort((a, b) => (a.producedAt || "").localeCompare(b.producedAt || ""));
  const waiting = lotsOf((s) => s.status === "Chờ kiểm định");
  const passed = lotsOf((s) => s.status === "Đạt" && !s.certificateNo);
  const supplying = lotsOf((s) => (s.status === "Đã chứng nhận" || (s.status === "Đạt" && Boolean(s.certificateNo))) && seedLotLeft(s, deliveries) > 0);

  const columns: WorkColumn[] = [
    { key: "producing", name: "Đang sản xuất", hint: "Kế hoạch → gieo cấy / nuôi → thu hoạch", summary: `${producing.filter((l) => l.status === "Đang sản xuất").length} đang làm · ${producing.filter((l) => l.status === "Kế hoạch").length} kế hoạch`, icon: Tractor, cards: producing.map(prodCard), emptyText: "Không có lô sản xuất" },
    { key: "harvested", name: "Đã thu hoạch", hint: "Chưa lập lô giống", summary: `${harvested.length} lô`, icon: Wheat, cards: harvestedCards, emptyText: "Không có lô chờ" },
    { key: "inspect", name: "Chờ kiểm định", hint: "Lấy mẫu, kiểm định đồng ruộng", summary: `${waiting.length} lô`, icon: ClipboardCheck, cards: waiting.map((s) => seedCard(s, "inspect")), emptyText: "Không có lô chờ" },
    { key: "certify", name: "Đạt – chờ chứng nhận", hint: "Cấp giấy chứng nhận, công bố hợp quy", summary: `${passed.length} lô`, icon: BadgeCheck, cards: passed.map((s) => seedCard(s, "certify")), emptyText: "Không có lô chờ" },
    { key: "supply", name: "Đang cung ứng", hint: "Còn hàng, giao theo đơn hoặc nhân cấp tiếp", summary: `${supplying.length} lô còn hàng`, icon: Sprout, cards: supplying.map((s) => seedCard(s, "supply")), emptyText: "Chưa có lô cung ứng" },
  ];

  const chip = (k: string, label: string) => (
    <Link key={k || "all"} href={k ? `/seed-workbench?kind=${encodeURIComponent(k)}` : "/seed-workbench"} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${kind === k ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>{label}</Link>
  );

  return (
    <>
      <Header title="Bàn sản xuất giống" description="Theo dõi và thao tác theo lô: sản xuất theo cấp, thu hoạch, lập lô giống, kiểm định, chứng nhận, giao giống, nhân cấp tiếp" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          {chip("", "Mọi loại")}
          {BREED_KINDS.map((k) => chip(k, k))}
        </div>
        <WorkBoard columns={columns} />
        <p className="text-[11px] text-muted-foreground">
          Hệ thống chặn nhân từ lô chưa đạt hoặc sai thứ bậc cấp giống, và chặn giao lô hết hiệu lực hợp quy hoặc vượt lượng còn lại. Danh sách đầy đủ: <Link href="/breed-production" className="text-primary hover:underline">Sản xuất theo cấp</Link> · <Link href="/seed-lots" className="text-primary hover:underline">Lô giống & chứng nhận</Link> · <Link href="/breed-orders" className="text-primary hover:underline">Đơn hàng & giao nhận</Link>.
        </p>
      </main>
    </>
  );
}
