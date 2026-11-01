import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { cultureBatchStore, lotSaleStore, productionProfileStore, seedlingLotStore, seedlingOrderStore } from "@/lib/modules/m3/data/tissue";
import { orderProgress, planOrder } from "@/lib/modules/m3/production";
import { contaminationRate, fmtPct } from "@/lib/modules/m3/rates";
import { fmtVND } from "@/lib/platform/format";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kế hoạch đơn hàng" };

/** Đơn hàng: kế hoạch tính ngược (M3.1.5), mẻ cấy – lô phục vụ đơn, các lần giao. */
export default async function SeedlingOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ stock?: string }> }) {
  const { id } = await params;
  const [orders, profiles, batches, lots, sales, customers] = await Promise.all([
    seedlingOrderStore.list(),
    productionProfileStore.list(),
    cultureBatchStore.list(),
    seedlingLotStore.list(),
    lotSaleStore.list(),
    getCustomers(),
  ]);
  const o = orders.find((x) => x.id === id);
  if (!o) notFound();
  const today = todayISO();
  const profile = profiles.find((p) => p.id === o.profileId);
  const myBatches = batches.filter((b) => b.orderId === id);
  const myLots = lots.filter((l) => l.orderId === id);
  const mySales = sales.filter((s) => s.orderId === id).sort((a, b) => (a.soldAt || "").localeCompare(b.soldAt || ""));
  // Chồi sẵn có: mặc định = chồi thu được của các mẻ đang nuôi gắn đơn (có thể nhập tay để thử kịch bản).
  const growingShoots = myBatches.filter((b) => b.status === "Đang nuôi").reduce((s, b) => s + (b.plantlets || 0), 0);
  const stock = Math.max(1, Number((await searchParams).stock) || growingShoots || 100);
  const plan = profile ? planOrder(o, profile, { stockShoots: stock, today }) : null;
  const pr = orderProgress(o, mySales);
  const customer = customers.find((c) => c.id === o.customerId);

  const steps = plan?.dates
    ? [
        { label: `Nhân nhanh – ${plan.cycles} lần cấy chuyển`, by: plan.dates.multiplyBy, detail: `từ ${stock.toLocaleString("vi-VN")} chồi → ≥ ${plan.toRoot.toLocaleString("vi-VN")} chồi (hệ số × ${profile!.multiplicationRate}, chu kỳ ${profile!.cycleDays} ngày)` },
        { label: "Đưa vào ra rễ", by: plan.dates.rootingBy, detail: `${plan.toRoot.toLocaleString("vi-VN")} chồi (tỷ lệ sống in vitro ${profile!.invitroSurvival}%)` },
        { label: "Ra ngôi vườn ươm", by: plan.dates.acclimatizeBy, detail: `${plan.toAcclimatize.toLocaleString("vi-VN")} cây (tỷ lệ sống vườn ươm ${profile!.nurserySurvival}%)` },
        { label: "Giao hàng", by: plan.dates.dueAt, detail: `${o.quantity.toLocaleString("vi-VN")} cây ${o.gradeRequired}${o.gradeRequired === "Loại 1" ? ` (tỷ lệ Loại 1 ${profile!.grade1Share}% → cần ${plan.sellable.toLocaleString("vi-VN")} cây sống)` : ""}` },
      ]
    : [];

  return (
    <>
      <Header title={`Đơn ${o.code}`} description={`${customer?.name ?? "—"} · ${o.species} ${o.variety} · ${o.quantity.toLocaleString("vi-VN")} cây ${o.gradeRequired} · giao ${fmtDateVN(o.dueAt) || "—"}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/seedling-orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Đơn hàng
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarRange className="w-4 h-4" />Kế hoạch tính ngược từ ngày giao</CardTitle>
            <CardDescription>{profile ? `Theo thông số ${profile.code}` : "Chưa chọn thông số sản xuất – sửa đơn hàng để lập kế hoạch"}</CardDescription>
          </CardHeader>
          {profile && (
            <CardContent className="space-y-4">
              <form method="get" className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Số chồi sẵn có để nhân:</span>
                <input name="stock" type="number" min={1} defaultValue={stock} className="h-9 w-32 rounded-md border border-input bg-background px-3" />
                <button className="h-9 px-3 rounded-md border bg-background hover:bg-accent">Tính lại</button>
                <span className="text-xs text-muted-foreground">{growingShoots ? `mặc định = ${growingShoots} chồi của các mẻ đang nuôi gắn đơn này` : "chưa có mẻ đang nuôi gắn đơn – giả định 100 chồi"}</span>
              </form>
              {!plan?.dates ? (
                <p className="text-sm text-amber-600">Đơn chưa có ngày cần giao – không tính được mốc thời gian.</p>
              ) : (
                <>
                  <div className={`rounded-md px-3 py-2 text-sm ${plan.feasible ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                    {plan.feasible
                      ? `Kịp tiến độ: còn ${plan.slackDays} ngày trước hạn bắt đầu nhân nhanh.`
                      : `Không kịp: hạn bắt đầu nhân nhanh đã qua ${-(plan.slackDays ?? 0)} ngày – tăng số chồi sẵn có, thỏa thuận lùi ngày giao hoặc giao nhiều đợt.`}
                  </div>
                  <ol className="relative border-l-2 border-primary/30 ml-3 space-y-3">
                    {steps.map((s) => (
                      <li key={s.label} className="ml-6">
                        <span className={`absolute -left-[7px] w-3 h-3 rounded-full ${s.by < today ? "bg-rose-500" : "bg-primary"}`} />
                        <div className="text-sm"><span className="font-medium">{s.label}</span> · <span className={s.by < today ? "text-rose-600 font-medium" : ""}>chậm nhất {fmtDateVN(s.by)}</span></div>
                        <div className="text-xs text-muted-foreground">{s.detail}</div>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </CardContent>
          )}
        </Card>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Mẻ cấy phục vụ đơn</CardTitle><CardDescription>Chọn đơn hàng khi tạo / sửa mẻ cấy</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {myBatches.map((b) => (
                  <li key={b.id} className="py-1.5 flex justify-between gap-2"><Link href={`/culture-batches/${b.id}`} className="font-mono text-xs text-primary hover:underline">{b.code}</Link><span className="text-xs text-muted-foreground">{b.stage} · {b.plantlets} chồi · nhiễm {fmtPct(contaminationRate(b))}</span></li>
                ))}
                {myBatches.length === 0 && <li className="py-1.5 text-xs text-muted-foreground">Chưa có</li>}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Lô vườn ươm</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {myLots.map((l) => (
                  <li key={l.id} className="py-1.5 flex justify-between gap-2"><span className="font-mono text-xs">{l.code}</span><span className="text-xs text-muted-foreground">{l.survived} sống · L1 {l.grade1Qty} · sẵn sàng {fmtDateVN(l.readyAt) || "—"}</span></li>
                ))}
                {myLots.length === 0 && <li className="py-1.5 text-xs text-muted-foreground">Chưa có</li>}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Đã giao {pr.pct}%</CardTitle><CardDescription>{pr.delivered.toLocaleString("vi-VN")} / {o.quantity.toLocaleString("vi-VN")} cây{pr.onTime && <Badge variant="success" className="ml-2">đúng hạn</Badge>}</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {mySales.map((s) => (
                  <li key={s.id} className="py-1.5 flex justify-between gap-2"><span className="font-mono text-xs">{s.code}</span><span className="text-xs text-muted-foreground">{fmtDateVN(s.soldAt)} · {s.quantity} cây · {fmtVND(s.quantity * s.unitPrice)}</span></li>
                ))}
                {mySales.length === 0 && <li className="py-1.5 text-xs text-muted-foreground">Chưa giao</li>}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
