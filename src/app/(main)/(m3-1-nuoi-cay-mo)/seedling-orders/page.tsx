import Link from "next/link";
import { ClipboardList, Factory, AlertTriangle, Truck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { lotSaleStore, productionProfileStore, seedlingOrderStore } from "@/lib/modules/m3/data/tissue";
import { GRADE_REQUIREMENTS, ORDER_STATUSES, orderProgress, planOrder } from "@/lib/modules/m3/production";
import { fmtVND } from "@/lib/platform/format";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đơn hàng cây giống" };

const OPEN = ["Mới", "Đã xác nhận", "Đang sản xuất", "Giao một phần"];

export default async function SeedlingOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, customers, profiles, sales] = await Promise.all([
    seedlingOrderStore.list(),
    getCustomers(),
    productionProfileStore.list(),
    lotSaleStore.list(),
  ]);
  const customerById = byId(customers);
  const profileById = byId(profiles);
  const today = todayISO();
  const fields: CrudField[] = [
    { name: "code", label: "Mã đơn hàng", required: true, mono: true, placeholder: "VD: DH-2026-001" },
    { name: "customerId", label: "Khách hàng", type: "select", options: refOptions(customers, (c) => `${c.code} · ${c.name}`) },
    { name: "species", label: "Loài", required: true },
    { name: "variety", label: "Giống" },
    { name: "profileId", label: "Thông số sản xuất (để lập kế hoạch)", type: "select", full: true, options: refOptions(profiles, (p) => `${p.code} · ${p.species} ${p.variety}`.trim()) },
    { name: "quantity", label: "Số cây cần giao", type: "number", required: true },
    { name: "gradeRequired", label: "Yêu cầu chất lượng", type: "select", options: [...GRADE_REQUIREMENTS] },
    { name: "dueAt", label: "Ngày cần giao", type: "date" },
    { name: "season", label: "Vụ trồng của khách", placeholder: "VD: Vụ Xuân 2027" },
    { name: "unitPrice", label: "Đơn giá (VND / cây)", type: "number" },
    { name: "status", label: "Trạng thái", type: "select", options: [...ORDER_STATUSES] },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => (a.dueAt || "9").localeCompare(b.dueAt || "9"))
    .filter((o) => matches(query, o.code, o.species, o.variety, customerById.get(o.customerId)?.name));
  const open = all.filter((o) => OPEN.includes(o.status));
  const salesOf = (id: string) => sales.filter((s) => s.orderId === id);
  const late = open.filter((o) => {
    const p = profileById.get(o.profileId);
    return p && planOrder(o, p, { stockShoots: 100, today }).feasible === false;
  });

  return (
    <>
      <Header title="Đơn hàng cây giống" description="Đơn hàng theo khách hàng, mùa vụ – lập kế hoạch tính ngược và theo dõi tiến độ giao" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Đơn đang mở", value: open.length, icon: ClipboardList, accent: "bg-blue-50 text-blue-600" },
            { label: "Cây cần sản xuất", value: open.reduce((s, o) => s + Math.max(0, o.quantity - orderProgress(o, salesOf(o.id)).delivered), 0).toLocaleString("vi-VN"), icon: Factory, accent: "bg-emerald-50 text-emerald-700", hint: "còn phải giao" },
            { label: "Có nguy cơ trễ", value: late.length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600", hint: "hạn bắt đầu nhân đã qua (giả định 100 chồi sẵn)" },
            { label: "Đã giao trong năm", value: sales.filter((s) => s.orderId && (s.soldAt || "").startsWith(today.slice(0, 4))).reduce((s, x) => s + x.quantity, 0).toLocaleString("vi-VN"), icon: Truck, accent: "bg-violet-50 text-violet-600" },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-3 text-xs">
            <Link href="/production-schedule" className="text-primary hover:underline">Lịch điều độ sản xuất →</Link>
            <Link href="/production-profiles" className="text-primary hover:underline">Thông số sản xuất theo giống →</Link>
          </div>
          <EntitySearchInput basePath="/seedling-orders" placeholder="Tìm mã, giống, khách hàng…" />
        </div>
        <CrudTableCard
          title="Danh sách đơn hàng"
          description="Bấm mã đơn để xem kế hoạch tính ngược, các mẻ cấy và lô đang phục vụ đơn"
          endpoint="/api/seedling-orders"
          entity="seedling-orders"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/seedling-orders" title="Thêm đơn hàng" fields={fields} addLabel="Thêm đơn hàng" />}
          headers={["Mã / khách", "Giống", "Số lượng · giá", "Ngày giao", "Đã giao", "Trạng thái"]}
          emptyText={query ? "Không có đơn phù hợp" : "Chưa có đơn hàng"}
          rows={rows.map((o) => {
            const pr = orderProgress(o, salesOf(o.id));
            const p = profileById.get(o.profileId);
            const plan = p ? planOrder(o, p, { stockShoots: 100, today }) : null;
            return {
              id: o.id,
              label: o.code,
              initial: o,
              cells: [
                <div key="c"><Link href={`/seedling-orders/${o.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{o.code}</Link><div className="text-[11px] text-muted-foreground">{customerById.get(o.customerId)?.name ?? "—"}</div></div>,
                <div key="s" className="text-sm">{o.species}<div className="text-[11px] text-muted-foreground">{o.variety}{o.season && ` · ${o.season}`}</div></div>,
                <div key="q" className="text-xs whitespace-nowrap">{o.quantity.toLocaleString("vi-VN")} cây · {o.gradeRequired}<div className="text-muted-foreground">{o.unitPrice ? `${fmtVND(o.unitPrice)}/cây` : ""}</div></div>,
                <div key="d" className="text-xs whitespace-nowrap">
                  {fmtDateVN(o.dueAt) || "—"}
                  {plan?.feasible === false && OPEN.includes(o.status) && <div className="text-rose-600 font-medium">trễ kế hoạch {-(plan.slackDays ?? 0)} ngày</div>}
                  {!p && <div className="text-amber-600">chưa chọn thông số</div>}
                </div>,
                <div key="p" className="text-xs min-w-[110px]">
                  <div className="flex items-center gap-1.5"><div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pr.pct}%` }} /></div><span>{pr.pct}%</span></div>
                  <div className="text-muted-foreground">{pr.delivered.toLocaleString("vi-VN")} cây</div>
                </div>,
                <Badge key="st" variant={o.status === "Hoàn thành" ? "success" : o.status === "Hủy" ? "destructive" : o.status === "Mới" ? "warning" : "default"}>{o.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
