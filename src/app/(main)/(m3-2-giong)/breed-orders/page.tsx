import { ClipboardList, Truck, Banknote, Clock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { breedOrderStore, deliveryStore, seedLotStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { BREED_ORDER_STATUSES, QTY_UNITS, SEED_LEVEL_NAMES } from "@/lib/modules/m3/breeding-rules";
import { fmtVND } from "@/lib/platform/format";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đơn hàng & giao nhận giống" };

export default async function BreedOrdersPage() {
  const [orders, deliveries, seedLots, varieties, customers] = await Promise.all([breedOrderStore.list(), deliveryStore.list(), seedLotStore.list(), varietyStore.list(), getCustomers()]);
  const varietyById = byId(varieties);
  const customerById = byId(customers);
  const seedById = byId(seedLots);
  const orderById = byId(orders);
  const today = todayISO();
  const deliveredOf = (id: string) => deliveries.filter((d) => d.orderId === id).reduce((s, d) => s + d.quantity, 0);
  const orderFields: CrudField[] = [
    { name: "code", label: "Mã đơn", required: true, mono: true, placeholder: "VD: DHG-2026-001" },
    { name: "customerId", label: "Khách hàng", type: "select", options: refOptions(customers, (c) => `${c.code} · ${c.name}`) },
    { name: "varietyId", label: "Giống", type: "select", required: true, options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "level", label: "Cấp giống", type: "select", options: ["", ...SEED_LEVEL_NAMES] },
    { name: "quantity", label: "Số lượng", type: "number", required: true },
    { name: "unit", label: "Đơn vị", type: "select", options: [...QTY_UNITS] },
    { name: "dueAt", label: "Ngày cần giao", type: "date" },
    { name: "season", label: "Mùa vụ" },
    { name: "unitPrice", label: "Đơn giá (VND / đơn vị)", type: "number" },
    { name: "status", label: "Trạng thái", type: "select", options: [...BREED_ORDER_STATUSES] },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const deliveryFields: CrudField[] = [
    { name: "code", label: "Số phiếu giao", required: true, mono: true, placeholder: "VD: GN-2026-001" },
    { name: "orderId", label: "Đơn hàng", type: "select", options: refOptions(orders.filter((o) => o.status !== "Hủy"), (o) => `${o.code} · ${o.quantity} ${o.unit}`) },
    { name: "seedLotId", label: "Lô giống (chỉ lô đạt, còn hiệu lực hợp quy)", type: "select", required: true, options: refOptions(seedLots.filter((s) => s.status === "Đạt" || s.status === "Đã chứng nhận"), (s) => `${s.code} · ${s.level} · ${s.quantity} ${s.unit}`) },
    { name: "deliveredAt", label: "Ngày giao", type: "date" },
    { name: "quantity", label: "Số lượng", type: "number", required: true },
    { name: "receiver", label: "Người nhận" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const open = orders.filter((o) => !["Hoàn thành", "Hủy"].includes(o.status));
  const year = today.slice(0, 4);

  return (
    <>
      <Header title="Đơn hàng & giao nhận giống" description="Đơn đặt giống theo cấp; phiếu giao nhận theo lô giống – không giao lô chưa đạt, hết hiệu lực hợp quy hoặc quá lượng còn lại" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Đơn đang mở", value: open.length, icon: ClipboardList, accent: "bg-blue-50 text-blue-600" },
            { label: "Quá ngày giao", value: open.filter((o) => o.dueAt && o.dueAt < today && deliveredOf(o.id) < o.quantity).length, icon: Clock, accent: "bg-rose-50 text-rose-600" },
            { label: `Phiếu giao ${year}`, value: deliveries.filter((d) => (d.deliveredAt || "").startsWith(year)).length, icon: Truck, accent: "bg-emerald-50 text-emerald-700" },
            { label: `Giá trị giao ${year}`, value: fmtVND(deliveries.filter((d) => (d.deliveredAt || "").startsWith(year)).reduce((s, d) => s + d.quantity * (orderById.get(d.orderId)?.unitPrice ?? 0), 0)), icon: Banknote, accent: "bg-violet-50 text-violet-600" },
          ]}
        />
        <CrudTableCard
          title="Đơn hàng"
          description="Tiến độ giao tính từ các phiếu giao gắn đơn"
          endpoint="/api/breed-orders"
          entity="breed-orders"
          editFields={orderFields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/breed-orders" title="Thêm đơn hàng" fields={orderFields} addLabel="Thêm đơn" />}
          headers={["Mã / khách", "Giống · cấp", "Số lượng · giá", "Ngày giao", "Đã giao", "Trạng thái"]}
          emptyText="Chưa có đơn hàng"
          rows={[...orders].sort((a, b) => (a.dueAt || "9").localeCompare(b.dueAt || "9")).map((o) => {
            const got = deliveredOf(o.id);
            const late = o.dueAt && o.dueAt < today && got < o.quantity && !["Hoàn thành", "Hủy"].includes(o.status);
            return {
              id: o.id,
              label: o.code,
              initial: o,
              cells: [
                <div key="c"><div className="font-mono text-xs font-semibold">{o.code}</div><div className="text-[11px] text-muted-foreground">{customerById.get(o.customerId)?.name ?? "—"}</div></div>,
                <div key="v" className="text-xs">{varietyById.get(o.varietyId)?.name ?? "—"}<div className="text-muted-foreground">{o.level}{o.season && ` · ${o.season}`}</div></div>,
                <div key="q" className="text-xs whitespace-nowrap">{o.quantity.toLocaleString("vi-VN")} {o.unit}<div className="text-muted-foreground">{o.unitPrice ? `${fmtVND(o.unitPrice)}/${o.unit}` : ""}</div></div>,
                <span key="d" className={`text-xs ${late ? "text-rose-600 font-medium" : ""}`}>{fmtDateVN(o.dueAt) || "—"}{late && " · quá hạn"}</span>,
                <span key="g" className="text-xs whitespace-nowrap">{got.toLocaleString("vi-VN")} / {o.quantity.toLocaleString("vi-VN")}</span>,
                <Badge key="s" variant={o.status === "Hoàn thành" ? "success" : o.status === "Hủy" ? "destructive" : "default"}>{o.status}</Badge>,
              ],
            };
          })}
        />
        <CrudTableCard
          title="Phiếu giao nhận"
          description="Mỗi phiếu gắn một lô giống – người mua quét QR trên bao bì để truy xuất"
          endpoint="/api/breed-deliveries"
          entity="breed-deliveries"
          editFields={deliveryFields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/breed-deliveries" title="Lập phiếu giao" fields={deliveryFields} addLabel="Lập phiếu giao" />}
          headers={["Số phiếu / ngày", "Lô giống", "Đơn hàng", "Số lượng", "Người nhận"]}
          emptyText="Chưa có phiếu giao"
          rows={[...deliveries].sort((a, b) => (b.deliveredAt || "").localeCompare(a.deliveredAt || "")).map((d) => {
            const s = seedById.get(d.seedLotId);
            return {
              id: d.id,
              label: d.code,
              initial: d,
              cells: [
                <div key="c"><div className="font-mono text-xs font-semibold">{d.code}</div><div className="text-[11px] text-muted-foreground">{fmtDateVN(d.deliveredAt)}</div></div>,
                <div key="l" className="text-xs"><span className="font-mono">{s?.code ?? "—"}</span><div className="text-muted-foreground">{s?.level}</div></div>,
                <span key="o" className="text-xs font-mono">{orderById.get(d.orderId)?.code ?? "—"}</span>,
                <span key="q" className="text-xs whitespace-nowrap">{d.quantity.toLocaleString("vi-VN")} {s?.unit}</span>,
                <span key="r" className="text-xs">{d.receiver || "—"}</span>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
