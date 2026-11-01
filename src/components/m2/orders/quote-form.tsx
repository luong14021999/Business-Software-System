"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btn, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { orderTotals } from "@/lib/modules/m2/orders";
import { fmtVND } from "@/lib/platform/format";

type Init = { priceListId: string; quoteNo: string; quotedAt: string; amount: number; discountPct: number; vatRate: number };

/** Số báo giá, ngày, giá trị trước thuế, giảm giá, thuế GTGT – xem ngay tổng tiền. */
export function QuoteForm({ orderId, initial, suggested, priceLists }: { orderId: string; initial: Init; suggested: number; priceLists: { id: string; name: string }[] }) {
  const [f, setF] = useState({ ...initial, quotedAt: initial.quotedAt.slice(0, 10) });
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const t = orderTotals(f.amount, f.discountPct, f.vatRate);
  const num = (k: keyof Init) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: Number(e.target.value.replace(/\D/g, "")) || 0 }));

  /** Đổi bảng giá → lưu ngay rồi tải lại để bảng kê tính theo giá mới. */
  async function changeList(priceListId: string) {
    setF((x) => ({ ...x, priceListId }));
    const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceListId }) });
    if (!res.ok) return toast.error("Không đổi được bảng giá", (await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    start(() => router.refresh());
  }

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không lưu được báo giá", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu báo giá");
    start(() => router.refresh());
  }

  const row = "grid gap-1 sm:grid-cols-[13rem_minmax(0,18rem)_auto] sm:items-center sm:gap-3";
  const label = "text-sm font-bold sm:text-right";
  return (
    <div className="space-y-3">
      <label className={row}>
        <span className={label}>Bảng giá áp dụng</span>
        <select value={f.priceListId} onChange={(e) => changeList(e.target.value)} className={input}>
          <option value="">— Đơn giá tham khảo của chỉ tiêu —</option>
          {priceLists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </label>
      <label className={row}><span className={label}>Số báo giá</span><input value={f.quoteNo} onChange={(e) => setF((x) => ({ ...x, quoteNo: e.target.value }))} className={input} /></label>
      <label className={row}><span className={label}>Ngày báo giá</span><input type="date" value={f.quotedAt} onChange={(e) => setF((x) => ({ ...x, quotedAt: e.target.value }))} className={input} /></label>
      <label className={row}>
        <span className={label}>Giá trị trước thuế (đ)</span>
        <input inputMode="numeric" value={f.amount ? f.amount.toLocaleString("vi-VN") : ""} onChange={num("amount")} className={input} />
        <button type="button" className={btn} onClick={() => setF((x) => ({ ...x, amount: suggested }))} disabled={!suggested}>Lấy theo bảng kê ({fmtVND(suggested)})</button>
      </label>
      <label className={row}><span className={label}>Giảm giá (%)</span><input inputMode="numeric" value={f.discountPct || ""} onChange={num("discountPct")} className={input} /></label>
      <label className={row}><span className={label}>Thuế GTGT (%)</span><input inputMode="numeric" value={f.vatRate || ""} onChange={num("vatRate")} className={input} /></label>
      <div className="rounded border border-[#ddd] bg-[#f9f9f9] p-3 text-sm sm:ml-[14rem] sm:max-w-md">
        <div className="flex justify-between"><span>Giảm giá</span><span>− {fmtVND(t.discount)}</span></div>
        <div className="flex justify-between"><span>Thuế GTGT</span><span>+ {fmtVND(t.vat)}</span></div>
        <div className="mt-1 flex justify-between border-t border-[#ddd] pt-1 font-bold"><span>Tổng giá trị đơn hàng</span><span>{fmtVND(t.total)}</span></div>
      </div>
      <div className="sm:ml-[14rem]">
        <button type="button" disabled={busy} onClick={save} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Lưu báo giá</button>
      </div>
    </div>
  );
}
