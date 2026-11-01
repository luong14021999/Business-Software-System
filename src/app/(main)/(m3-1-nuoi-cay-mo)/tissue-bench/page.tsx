import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightLeft, Biohazard, ClipboardCheck, FlaskConical, Sprout, Truck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { WorkBoard, type WorkCard, type WorkColumn, type Tone } from "@/components/common/work-board";
import {
  CULTURE_STAGES,
  LOT_GRADES,
  LOT_STATUSES,
  cabinetStore,
  cultureBatchStore,
  growthRoomStore,
  lotSaleStore,
  mediaBatchStore,
  mediaRecipeStore,
  seedlingLotStore,
  seedlingOrderStore,
  tissueMaterialStore,
  type CultureBatch,
  type SeedlingLot,
} from "@/lib/modules/m3/data/tissue";
import { addDays, nextStage, suggestCode } from "@/lib/modules/m3/bench";
import { contaminationRate, fmtPct } from "@/lib/modules/m3/rates";
import { DEFAULT_CONTAMINATION_THRESHOLD, MIN_VESSELS_FOR_CONCLUSION, lineage } from "@/lib/modules/m3/tissue-rules";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { getSetting } from "@/lib/platform/data/settings";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bàn cấy" };

/** Cửa sổ "sắp đến hạn" (ngày) của cấy chuyển và lô vườn ươm. */
const SOON = 3;
/** Số ngày mặc định từ ra ngôi đến đủ tiêu chuẩn xuất khi chưa có hồ sơ sản xuất. */
const NURSERY_DAYS = 30;

const STAGE_HINT: Record<string, string> = {
  "Khởi đầu": "Vào mẫu, khử trùng, tái sinh chồi",
  "Nhân nhanh": "Cấy chuyển nhân chồi",
  "Ra rễ": "Tạo cây hoàn chỉnh",
  "Ra ngôi": "Chờ đưa ra vườn ươm",
};

const vn = (x: number) => (Number(x) || 0).toLocaleString("vi-VN");
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + (Number(f(x)) || 0), 0);

function due(days: number, prefix: string): WorkCard["due"] {
  if (!Number.isFinite(days)) return undefined;
  if (days < 0) return { label: `${prefix} quá ${-days} ngày`, tone: "red" };
  if (days === 0) return { label: `${prefix} hôm nay`, tone: "amber" };
  return { label: `${prefix} còn ${days} ngày`, tone: days <= SOON ? "amber" : "muted" };
}

const actionBtn = (icon: ReactNode, label: string, primary = false) => (
  <Button type="button" size="sm" variant={primary ? "default" : "outline"} className="h-7 gap-1 px-2 text-[11px]">
    {icon}
    {label}
  </Button>
);

/** M3.1 – màn hình làm việc của kỹ thuật viên: mẻ theo giai đoạn, thao tác ngay trên thẻ. */
export default async function TissueBenchPage({ searchParams }: { searchParams: Promise<{ room?: string; due?: string }> }) {
  const sp = await searchParams;
  const [batches, materials, recipes, mediaBatches, cabinets, rooms, lots, sales, orders, threshold, customers] = await Promise.all([
    cultureBatchStore.list(),
    tissueMaterialStore.list(),
    mediaRecipeStore.list(),
    mediaBatchStore.list(),
    cabinetStore.list(),
    growthRoomStore.list(),
    seedlingLotStore.list(),
    lotSaleStore.list(),
    seedlingOrderStore.list(),
    getSetting("tissue_contamination_threshold").catch(() => DEFAULT_CONTAMINATION_THRESHOLD),
    getCustomers(),
  ]);
  const today = todayISO();
  const room = rooms.some((r) => r.id === sp.room) ? sp.room! : "";
  const dueOnly = sp.due === "1";
  const materialById = byId(materials);
  const orderById = byId(orders);
  const batchById = byId(batches);
  const recipeById = byId(recipes);
  const cabinetById = byId(cabinets);
  const roomById = byId(rooms);
  const batchCodes = batches.map((b) => b.code);
  const lotCodes = lots.map((l) => l.code);

  const varietyOf = (b: CultureBatch | undefined) => {
    if (!b) return "";
    const root = lineage(b.id, batches).at(-1);
    const m = materialById.get(root?.materialId ?? b.materialId);
    if (m) return `${m.species} ${m.variety}`.trim();
    const o = orderById.get(b.orderId);
    return o ? `${o.species} ${o.variety}`.trim() : "";
  };

  // Lô môi trường dùng được hôm nay: đạt QC, chưa hết hạn.
  const usableMedia = mediaBatches.filter((m) => m.qcResult === "Đạt" && (!m.expiresAt || m.expiresAt >= today));
  const mediaOptions = refOptions(usableMedia, (m) => `${m.code} · ${recipeById.get(m.recipeId)?.code ?? ""} · HSD ${fmtDateVN(m.expiresAt) || "—"}`);
  const recipeOptions = refOptions(recipes, (r) => `${r.code} · ${r.name}${r.stage ? ` (${r.stage})` : ""}`);
  const cabinetOptions = refOptions(cabinets.filter((c) => c.status !== "Ngừng dùng"), (c) => `${c.code} · ${c.name}`);

  const transferFields = (b: CultureBatch): CrudField[] => [
    { name: "code", label: "Mã mẻ mới", required: true, mono: true },
    { name: "stage", label: "Giai đoạn mẻ mới", type: "select", options: CULTURE_STAGES.slice(Math.max(0, (CULTURE_STAGES as readonly string[]).indexOf(b.stage))) },
    { name: "startedAt", label: "Ngày cấy chuyển", type: "date", required: true },
    { name: "nextTransferAt", label: "Hẹn cấy chuyển tiếp", type: "date" },
    { name: "harvested", label: "Số chồi thu từ mẻ cha", type: "number", nullable: true },
    { name: "vessels", label: "Số bình cấy mẻ mới", type: "number", required: true },
    { name: "parentContaminated", label: `Số bình nhiễm mẻ cha (/${vn(b.vessels)})`, type: "number", nullable: true },
    { name: "mediaBatchId", label: "Lô môi trường (Đạt, còn hạn)", type: "select", options: mediaOptions },
    { name: "recipeId", label: "Công thức môi trường", type: "select", options: recipeOptions },
    { name: "cabinetId", label: "Tủ cấy", type: "select", options: cabinetOptions },
    { name: "operator", label: "Người cấy" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const acclimatizeFields: CrudField[] = [
    { name: "code", label: "Mã lô cây giống", required: true, mono: true },
    { name: "acclimatizedAt", label: "Ngày ra ngôi", type: "date", required: true },
    { name: "quantity", label: "Số cây ra ngôi", type: "number", required: true },
    { name: "nurseryBed", label: "Luống / khu vườn ươm" },
    { name: "readyAt", label: "Dự kiến đủ tiêu chuẩn xuất", type: "date" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const contaminationFields: CrudField[] = [{ name: "added", label: "Số bình nhiễm phát hiện thêm", type: "number", required: true, full: true }];
  const gradingFields: CrudField[] = [
    { name: "survived", label: "Số cây sống", type: "number" },
    { name: "grade1Qty", label: "Loại 1", type: "number" },
    { name: "grade2Qty", label: "Loại 2", type: "number" },
    { name: "rejectQty", label: "Không đạt", type: "number" },
    { name: "status", label: "Trạng thái", type: "select", options: [...LOT_STATUSES] },
    { name: "readyAt", label: "Ngày đủ tiêu chuẩn", type: "date" },
  ];

  const contaminationOf = (b: CultureBatch): WorkCard["metric"] => {
    const rate = contaminationRate(b);
    if (rate == null) return null;
    const tone: Tone = rate > threshold && b.vessels >= MIN_VESSELS_FOR_CONCLUSION ? "red" : rate > threshold ? "amber" : "green";
    return { label: `Nhiễm ${vn(b.contaminated)}/${vn(b.vessels)} bình · ${fmtPct(rate)}${tone === "red" ? ` > ngưỡng ${threshold}%` : ""}`, tone };
  };

  const batchCard = (b: CultureBatch): WorkCard => {
    const canAcclimatize = b.stage === "Ra rễ" || b.stage === "Ra ngôi";
    const target = b.stage === "Khởi đầu" ? nextStage(b.stage) : b.stage;
    return {
      id: b.id,
      code: b.code,
      href: `/culture-batches/${b.id}`,
      title: varietyOf(b),
      facts: [
        b.startedAt ? `cấy ${fmtDateVN(b.startedAt)}` : "",
        `${vn(b.vessels)} bình`,
        b.subcultureNo ? `lần ${b.subcultureNo}` : "",
        roomById.get(b.roomId)?.code ?? "",
        cabinetById.get(b.cabinetId)?.code ?? "",
        b.operator,
        orderById.get(b.orderId) ? `đơn ${orderById.get(b.orderId)!.code}` : "",
      ],
      metric: contaminationOf(b),
      due: due(daysUntil(b.nextTransferAt), "cấy chuyển"),
      actions: (
        <>
          <EntityFormDialog
            mode="add"
            endpoint="/api/culture-batches"
            actionUrl={`/api/culture-batches/${b.id}/transfer`}
            title={`Cấy chuyển mẻ ${b.code}`}
            description={`Tạo mẻ mới nối phả hệ với ${b.code}; mẻ ${b.code} chuyển sang “Đã cấy chuyển”.`}
            fields={transferFields(b)}
            initial={{ code: suggestCode(b.code, batchCodes), stage: target, startedAt: today, nextTransferAt: addDays(today, 28), vessels: b.vessels, harvested: b.plantlets || "", parentContaminated: b.contaminated, recipeId: b.recipeId, cabinetId: b.cabinetId, operator: b.operator }}
            submitLabel="Cấy chuyển"
            successText="Đã cấy chuyển"
            trigger={actionBtn(<ArrowRightLeft />, "Cấy chuyển", !canAcclimatize)}
          />
          {canAcclimatize && (
            <EntityFormDialog
              mode="add"
              endpoint="/api/seedling-lots"
              actionUrl={`/api/culture-batches/${b.id}/acclimatize`}
              title={`Ra ngôi mẻ ${b.code}`}
              description="Lập lô cây giống trong vườn ươm; mẻ chuyển sang “Chuyển ra ngôi” và nối truy xuất nguồn gốc."
              fields={acclimatizeFields}
              initial={{ code: suggestCode(`LO-${b.code}`, lotCodes), acclimatizedAt: today, quantity: b.plantlets || b.vessels, readyAt: addDays(today, NURSERY_DAYS) }}
              submitLabel="Ra ngôi"
              successText="Đã lập lô vườn ươm"
              trigger={actionBtn(<Sprout />, "Ra ngôi", true)}
            />
          )}
          <EntityFormDialog
            mode="add"
            endpoint="/api/culture-batches"
            actionUrl={`/api/culture-batches/${b.id}/contamination`}
            title={`Ghi nhiễm – ${b.code}`}
            description={`Hiện đã ghi ${vn(b.contaminated)}/${vn(b.vessels)} bình nhiễm. Số nhập được cộng dồn.`}
            fields={contaminationFields}
            submitLabel="Ghi nhận"
            successText="Đã ghi nhiễm"
            trigger={actionBtn(<Biohazard />, "Ghi nhiễm")}
          />
        </>
      ),
    };
  };

  const saleCodes = sales.map((x) => x.code);
  const openOrderOptions = refOptions(orders.filter((o) => o.status !== "Hủy" && o.status !== "Hoàn thành"), (o) => `${o.code} · ${o.species} ${o.variety}`);
  const customerOptions = refOptions(customers, (c) => `${c.code} · ${c.name}`);
  const soldOf = (lotId: string) => sum(sales.filter((s) => s.lotId === lotId), (s) => s.quantity);
  const lotCard = (l: SeedlingLot, ready: boolean): WorkCard => {
    const left = Math.max(0, (l.survived || 0) - soldOf(l.id));
    return {
      id: l.id,
      code: l.code,
      href: `/seedling-lots?q=${encodeURIComponent(l.code)}`,
      title: varietyOf(batchById.get(l.batchId)) || (orderById.get(l.orderId) ? `${orderById.get(l.orderId)!.species} ${orderById.get(l.orderId)!.variety}`.trim() : ""),
      facts: ready
        ? [`còn ${vn(left)} cây`, l.grade1Qty ? `L1 ${vn(l.grade1Qty)}` : "", l.grade2Qty ? `L2 ${vn(l.grade2Qty)}` : "", orderById.get(l.orderId) ? `đơn ${orderById.get(l.orderId)!.code}` : ""]
        : [l.acclimatizedAt ? `ra ngôi ${fmtDateVN(l.acclimatizedAt)}` : "", `${vn(l.survived)}/${vn(l.quantity)} cây sống`, l.nurseryBed],
      due: ready ? undefined : due(daysUntil(l.readyAt), "đủ chuẩn"),
      actions: (
        <>
          <EntityFormDialog
            mode="edit"
            endpoint="/api/seedling-lots"
            id={l.id}
            title={`Đánh giá, phân loại lô ${l.code}`}
            description="Loại 1 + Loại 2 + Không đạt không vượt số cây sống. Đủ tiêu chuẩn → chuyển trạng thái để xuất bán."
            fields={gradingFields}
            initial={{ ...l, status: ready ? l.status : "Đủ tiêu chuẩn xuất", readyAt: l.readyAt || today }}
            successText="Đã cập nhật lô"
            trigger={actionBtn(<ClipboardCheck />, ready ? "Phân loại" : "Đánh giá", !ready)}
          />
          {ready && left > 0 && (
            <EntityFormDialog
              mode="add"
              endpoint="/api/lot-sales"
              title={`Xuất bán từ lô ${l.code}`}
              description={`Còn ${vn(left)} cây. Phiếu xuất gắn lô để khách tra cứu nguồn gốc bằng mã QR.`}
              fields={[
                { name: "code", label: "Số phiếu xuất", required: true, mono: true },
                { name: "lotId", label: "Lô cây giống", type: "select", options: [{ value: l.id, label: l.code }] },
                { name: "orderId", label: "Theo đơn hàng", type: "select", options: openOrderOptions },
                { name: "customerId", label: "Khách hàng (trống = theo đơn hàng)", type: "select", options: customerOptions },
                { name: "soldAt", label: "Ngày xuất", type: "date" },
                { name: "quantity", label: `Số cây (≤ ${vn(left)})`, type: "number", required: true },
                { name: "grade", label: "Loại", type: "select", options: [...LOT_GRADES] },
                { name: "unitPrice", label: "Đơn giá (VND / cây; trống = theo đơn)", type: "number" },
                { name: "note", label: "Ghi chú", type: "textarea" },
              ]}
              initial={{ code: suggestCode(`PX-${l.code}`, saleCodes), lotId: l.id, orderId: l.orderId, soldAt: today, quantity: left, grade: l.grade1Qty ? "Loại 1" : "Loại 2" }}
              submitLabel="Xuất"
              successText="Đã lập phiếu xuất"
              trigger={actionBtn(<Truck />, "Xuất bán", true)}
            />
          )}
        </>
      ),
    };
  };

  const isDue = (iso: string) => Number.isFinite(daysUntil(iso)) && daysUntil(iso) <= SOON;
  const growing = batches.filter((b) => b.status === "Đang nuôi" && (!room || b.roomId === room) && (!dueOnly || isDue(b.nextTransferAt)));
  const byDue = (a: { d: string }, b: { d: string }) => (a.d || "9999").localeCompare(b.d || "9999");
  const stageNames = [...CULTURE_STAGES, ...new Set(growing.map((b) => b.stage).filter((s) => s && !(CULTURE_STAGES as readonly string[]).includes(s)))];

  const columns: WorkColumn[] = stageNames.map((name) => {
    const list = growing.filter((b) => b.stage === name).map((b) => ({ b, d: b.nextTransferAt })).sort(byDue).map((x) => x.b);
    return {
      key: name,
      name,
      hint: STAGE_HINT[name] ?? "Giai đoạn nuôi cấy",
      summary: `${vn(sum(list, (b) => b.vessels))} bình · ${vn(sum(list, (b) => b.plantlets))} chồi/cây`,
      icon: FlaskConical,
      cards: list.map(batchCard),
      emptyText: "Không có mẻ",
    };
  });
  if (!room) {
    const nursery = lots.filter((l) => l.status === "Vườn ươm" && (!dueOnly || isDue(l.readyAt))).map((l) => ({ l, d: l.readyAt })).sort(byDue).map((x) => x.l);
    const ready = dueOnly ? [] : lots.filter((l) => l.status === "Đủ tiêu chuẩn xuất" && (l.survived || 0) - soldOf(l.id) > 0);
    columns.push(
      { key: "nursery", name: "Vườn ươm", hint: "Huấn luyện cây, chờ đánh giá", summary: `${vn(sum(nursery, (l) => l.survived))} cây sống`, icon: Sprout, cards: nursery.map((l) => lotCard(l, false)), emptyText: "Không có lô" },
      { key: "ready", name: "Đủ tiêu chuẩn xuất", hint: "Đã phân loại, chờ giao", summary: `${vn(sum(ready, (l) => (l.survived || 0) - soldOf(l.id)))} cây còn lại`, icon: Sprout, cards: ready.map((l) => lotCard(l, true)), emptyText: "Chưa có lô" },
    );
  }

  const newBatchFields: CrudField[] = [
    { name: "code", label: "Mã mẻ cấy", required: true, mono: true, placeholder: "VD: ME-2026-001" },
    { name: "stage", label: "Giai đoạn", type: "select", options: [...CULTURE_STAGES] },
    { name: "materialId", label: "Vật liệu khởi đầu", type: "select", options: refOptions(materials, (m) => `${m.code} · ${m.species} ${m.variety}`.trim()) },
    { name: "startedAt", label: "Ngày vào mẫu", type: "date" },
    { name: "nextTransferAt", label: "Hẹn cấy chuyển", type: "date" },
    { name: "explants", label: "Số mẫu đưa vào", type: "number" },
    { name: "vessels", label: "Số bình cấy", type: "number" },
    { name: "mediaBatchId", label: "Lô môi trường (Đạt, còn hạn)", type: "select", options: mediaOptions },
    { name: "recipeId", label: "Công thức môi trường", type: "select", options: recipeOptions },
    { name: "roomId", label: "Phòng nuôi", type: "select", options: refOptions(rooms, (r) => `${r.code} · ${r.name}`) },
    { name: "cabinetId", label: "Tủ cấy", type: "select", options: cabinetOptions },
    { name: "operator", label: "Người cấy" },
    { name: "orderId", label: "Phục vụ đơn hàng", type: "select", options: refOptions(orders.filter((o) => o.status !== "Hoàn thành" && o.status !== "Hủy"), (o) => `${o.code} · ${o.species} ${o.variety}`) },
  ];
  const chip = (href: string, label: string, active: boolean) => (
    <Link key={href} href={href} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>{label}</Link>
  );
  const qs = (o: { room?: string; due?: boolean }) => {
    const p = new URLSearchParams();
    if (o.room) p.set("room", o.room);
    if (o.due) p.set("due", "1");
    return `/tissue-bench${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <Header title="Bàn cấy" description="Làm việc theo mẻ: cấy chuyển, ra ngôi, ghi nhiễm, đánh giá lô vườn ươm – ngay trên thẻ của từng giai đoạn" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          {chip(qs({ due: dueOnly }), "Mọi phòng", !room)}
          {[...rooms].sort((a, b) => a.code.localeCompare(b.code)).map((r) => chip(qs({ room: r.id, due: dueOnly }), r.code, room === r.id))}
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          {chip(qs({ room, due: !dueOnly }), `Đến hạn ≤ ${SOON} ngày`, dueOnly)}
          <div className="ml-auto">
            <EntityFormDialog mode="add" endpoint="/api/culture-batches" title="Vào mẫu – mẻ khởi đầu" fields={newBatchFields} initial={{ stage: "Khởi đầu", startedAt: today, nextTransferAt: addDays(today, 28) }} addLabel="Vào mẫu mới" />
          </div>
        </div>
        <WorkBoard columns={columns} />
        <p className="text-[11px] text-muted-foreground">
          Viền đỏ: quá hạn · vàng: đến hạn trong {SOON} ngày. Nhiễm đỏ khi vượt ngưỡng {threshold}% với từ {MIN_VESSELS_FOR_CONCLUSION} bình trở lên. Danh sách đầy đủ: <Link href="/culture-batches" className="text-primary hover:underline">Mẻ cấy</Link> · <Link href="/seedling-lots" className="text-primary hover:underline">Lô cây giống</Link>.
        </p>
      </main>
    </>
  );
}
