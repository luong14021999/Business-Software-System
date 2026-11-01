import { getCustomers } from "@/lib/modules/m2/data/customers";
import { cultureBatchStore, mediaBatchStore, productionProfileStore, seedlingLotStore, seedlingOrderStore } from "./tissue";
import { planOrder } from "../production";
import { byId } from "@/lib/platform/ref-options";

export const SCHEDULE_KINDS = ["Cấy chuyển", "Bắt đầu nhân", "Đưa ra rễ", "Ra ngôi", "Lô đủ tiêu chuẩn", "Giao hàng", "Môi trường hết hạn"] as const;
export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];
export type ScheduleItem = { date: string; kind: ScheduleKind; code: string; href: string; text: string };

/** Lịch điều độ (M3.1.5): cấy chuyển đến hạn, mốc kế hoạch của đơn hàng, lô sắp đủ tiêu chuẩn, ngày giao, lô môi trường hết hạn. */
export async function loadSchedule(today: string): Promise<ScheduleItem[]> {
  const [batches, orders, profiles, lots, customers, media] = await Promise.all([
    cultureBatchStore.list(),
    seedlingOrderStore.list(),
    productionProfileStore.list(),
    seedlingLotStore.list(),
    getCustomers(),
    mediaBatchStore.list(),
  ]);
  const profileById = byId(profiles);
  const customerById = byId(customers);
  const items: ScheduleItem[] = [];
  for (const b of batches) {
    if (b.status === "Đang nuôi" && b.nextTransferAt) items.push({ date: b.nextTransferAt, kind: "Cấy chuyển", code: b.code, href: `/culture-batches/${b.id}`, text: `${b.stage} · ${b.vessels} bình · ${b.operator || "chưa phân công"}` });
  }
  for (const o of orders) {
    if (!["Mới", "Đã xác nhận", "Đang sản xuất", "Giao một phần"].includes(o.status) || !o.dueAt) continue;
    const who = customerById.get(o.customerId)?.name ?? "";
    items.push({ date: o.dueAt, kind: "Giao hàng", code: o.code, href: `/seedling-orders/${o.id}`, text: `${o.quantity.toLocaleString("vi-VN")} cây ${o.species} ${o.variety} · ${who}` });
    const p = profileById.get(o.profileId);
    const plan = p ? planOrder(o, p, { stockShoots: batches.filter((b) => b.orderId === o.id && b.status === "Đang nuôi").reduce((s, b) => s + b.plantlets, 0) || 100, today }) : null;
    if (plan?.dates) {
      if (plan.cycles > 0) items.push({ date: plan.dates.multiplyBy, kind: "Bắt đầu nhân", code: o.code, href: `/seedling-orders/${o.id}`, text: `${plan.cycles} lần cấy chuyển · ${o.species} ${o.variety}` });
      items.push({ date: plan.dates.rootingBy, kind: "Đưa ra rễ", code: o.code, href: `/seedling-orders/${o.id}`, text: `${plan.toRoot.toLocaleString("vi-VN")} chồi` });
      items.push({ date: plan.dates.acclimatizeBy, kind: "Ra ngôi", code: o.code, href: `/seedling-orders/${o.id}`, text: `${plan.toAcclimatize.toLocaleString("vi-VN")} cây` });
    }
  }
  for (const l of lots) {
    if (l.status === "Vườn ươm" && l.readyAt) items.push({ date: l.readyAt, kind: "Lô đủ tiêu chuẩn", code: l.code, href: `/seedling-lots?q=${encodeURIComponent(l.code)}`, text: `${l.survived} cây sống · luống ${l.nurseryBed || "—"}` });
  }
  for (const m of media) {
    if (m.qcResult === "Đạt" && m.expiresAt && m.expiresAt >= today) items.push({ date: m.expiresAt, kind: "Môi trường hết hạn", code: m.code, href: `/media-batches?q=${encodeURIComponent(m.code)}`, text: `${m.vessels} bình môi trường hết hạn dùng` });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}
