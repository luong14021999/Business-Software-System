"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer, X } from "lucide-react";
import { btn, btnPrimary, input, table } from "@/components/m2/lab-ui/page";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { toast } from "@/components/ui/toast";
import { EXTRA_COSTS, discountedPrice, quoteItemsTotal, type QuoteItem } from "@/lib/modules/m2/orders";

/** Dòng đang sửa; `key` = "loại mẫu|chỉ tiêu" để áp đơn giá theo bảng giá. */
type Item = QuoteItem & { key?: string };
type Quote = { id: string; code: string; quotedAt: string; discountPct: number; vatRate: number; managementFeePct: number; note: string; lines: QuoteItem[] };

/** Màu nhãn loại mẫu như XaLab (xanh / đỏ / xanh dương xen kẽ theo loại). */
const BADGE = ["bg-[#5cb85c]", "bg-[#d9534f]", "bg-[#5bc0de]", "bg-[#f0ad4e]", "bg-[#337ab7]"];

/**
 * Sửa một báo giá như XaLab: Giảm giá % · VAT % · Phí quản lý % · Ngày báo giá, Ghi chú, Bảng giá [Áp dụng bảng giá],
 * bảng chỉ tiêu (đơn giá sửa được, đơn giá đã giảm, thành tiền), Tổng cộng; [←][Lưu & thoát][Lưu] | In ấn.
 */
export function QuoteForm({
  orderId,
  backHref,
  quote,
  priceLists,
  prices,
  catalog,
  applied,
}: {
  orderId: string;
  backHref: string;
  quote: Quote;
  priceLists: { id: string; name: string }[];
  prices: Record<string, Record<string, number>>;
  catalog: { typeName: string; analyte: string; unit: string }[];
  /** Báo giá này đang là giá trị đơn hàng (chốt). */
  applied: boolean;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [items, setItems] = useState<Item[]>(() => quote.lines.map((l) => ({ ...l, key: l.group && l.group !== "Chi phí khác" ? `${l.group}|${l.label}` : undefined })));
  const [f, setF] = useState({ discountPct: String(quote.discountPct || 0), vatRate: String(quote.vatRate || 0), managementFeePct: String(quote.managementFeePct || 0), quotedAt: (quote.quotedAt || "").slice(0, 10), note: quote.note });
  const [listId, setListId] = useState("");
  const [extra, setExtra] = useState<string>(EXTRA_COSTS[0].label);
  const [pickType, setPickType] = useState(catalog[0]?.typeName ?? "");
  const [pickAnalyte, setPickAnalyte] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [busy, setBusy] = useState<string | null>(null);

  const types = useMemo(() => [...new Set(catalog.map((c) => c.typeName))], [catalog]);
  const groups = useMemo(() => [...new Set(items.map((x) => x.group).filter(Boolean))] as string[], [items]);
  const ofType = catalog.filter((c) => c.typeName === pickType);
  const d = Number(f.discountPct) || 0;
  const t = quoteItemsTotal(items, d, Number(f.vatRate) || 0, Number(f.managementFeePct) || 0);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setItem = (i: number, k: keyof Item, v: string) =>
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: k === "quantity" || k === "unitPrice" ? Number(v.replace(/[^\d.]/g, "")) || 0 : v } : x)));
  const priceFor = (key: string) => prices[listId]?.[key] ?? prices[""]?.[key] ?? 0;

  function applyList() {
    if (!listId) return toast.error("Chọn bảng giá cần áp");
    const has = (x: Item) => Boolean(x.key && prices[listId]?.[x.key] != null);
    const n = items.filter(has).length;
    setItems((xs) => xs.map((x) => (has(x) ? { ...x, unitPrice: prices[listId][x.key!] } : x)));
    toast.success(`Đã áp đơn giá cho ${n} dòng`);
  }
  function addAnalyte(all = false) {
    const picked = all ? ofType : ofType.filter((c) => c.analyte === pickAnalyte);
    if (!picked.length) return toast.error("Chọn chỉ tiêu");
    const qty = Math.max(1, Number(pickQty) || 1);
    setItems((xs) => {
      const next = [...xs];
      for (const c of picked) {
        const key = `${c.typeName}|${c.analyte}`;
        const at = next.findIndex((x) => x.key === key);
        if (at >= 0) next[at] = { ...next[at], quantity: next[at].quantity + qty };
        else next.push({ key, label: c.analyte, unit: "mẫu", quantity: qty, unitPrice: priceFor(key), group: c.typeName });
      }
      return next;
    });
  }
  function addExtra() {
    const e = EXTRA_COSTS.find((x) => x.label === extra);
    if (e) setItems((xs) => [...xs, { label: e.label, unit: e.unit, quantity: 1, unitPrice: 0, group: "Chi phí khác" }]);
  }

  async function save(exit: boolean) {
    setBusy(exit ? "exit" : "save");
    const res = await fetch(`/api/order-quotes/${quote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, lines: items.map((x) => ({ label: x.label, unit: x.unit, quantity: x.quantity, unitPrice: x.unitPrice, group: x.group })) }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được báo giá", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã lưu báo giá ${quote.code}`);
    if (exit) return start(() => router.push(backHref));
    start(() => router.refresh());
  }
  async function applyToOrder() {
    setBusy("apply");
    const res = await fetch(`/api/order-quotes/${quote.id}/apply`, { method: "POST" });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không chốt được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã chốt ${quote.code} làm giá trị đơn hàng`, `${Number(b.total).toLocaleString("vi-VN")} đ (lưu báo giá trước nếu vừa sửa)`);
    start(() => router.refresh());
  }

  const lbl = "text-sm font-bold text-[#333] sm:text-right";
  const small = `${input} !w-[68px]`;
  return (
    <div>
      <div className="grid items-center gap-x-[30px] gap-y-[15px] sm:grid-cols-[165px_68px_80px_68px_110px_68px_130px_minmax(0,1fr)]">
        <span className={lbl}>Giảm giá đơn hàng %</span><input inputMode="decimal" value={f.discountPct} onChange={set("discountPct")} aria-label="Giảm giá đơn hàng %" className={small} />
        <span className={lbl}>VAT %</span><input inputMode="decimal" value={f.vatRate} onChange={set("vatRate")} aria-label="VAT %" className={small} />
        <span className={lbl}>Phí quản lý %</span><input inputMode="decimal" value={f.managementFeePct} onChange={set("managementFeePct")} aria-label="Phí quản lý %" className={small} />
        <span className={lbl}>Ngày báo giá</span><input type="date" value={f.quotedAt} onChange={set("quotedAt")} aria-label="Ngày báo giá" className={`${input} bg-[#eee]`} />
      </div>
      <div className="mt-[15px] grid items-center gap-x-[30px] gap-y-[15px] sm:grid-cols-[165px_minmax(0,1fr)]">
        <span className={lbl}>Ghi chú</span><input value={f.note} onChange={set("note")} aria-label="Ghi chú" className={input} />
        <span className={lbl}>Bảng giá</span>
        <div className="flex gap-[30px]">
          <select value={listId} onChange={(e) => setListId(e.target.value)} aria-label="Bảng giá" className={input}>
            <option value="" />
            {priceLists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <button type="button" onClick={applyList} className={btnPrimary}>Áp dụng bảng giá</button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className={table}>
          <thead><tr><th className="w-8">#</th><th>Chỉ tiêu</th><th>Đơn vị</th><th className="w-24">Số lượng</th><th className="w-40">Đơn giá (đồng)</th><th className="text-right">Đơn giá đã giảm</th><th className="text-right">Thành tiền</th><th className="w-8" /></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Chưa có chỉ tiêu – thêm ở dưới</td></tr>}
            {items.map((x, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  {x.group && <span className={`mr-1 rounded px-1.5 py-0.5 text-[12px] font-bold text-white ${x.group === "Chi phí khác" ? "bg-[#777]" : BADGE[groups.indexOf(x.group) % BADGE.length]}`}>{x.group}</span>}
                  {x.key ? x.label : <input value={x.label} onChange={(e) => setItem(i, "label", e.target.value)} aria-label="Khoản mục" className={`${input} inline-block h-8 !w-64`} />}
                </td>
                <td><input value={x.unit} onChange={(e) => setItem(i, "unit", e.target.value)} aria-label="Đơn vị" className={`${input} h-8 !w-24 px-2`} /></td>
                <td><input inputMode="decimal" value={x.quantity || ""} onChange={(e) => setItem(i, "quantity", e.target.value)} aria-label="Số lượng" className={`${input} h-8 px-2`} /></td>
                <td><input inputMode="numeric" value={x.unitPrice ? x.unitPrice.toLocaleString("vi-VN") : "0"} onChange={(e) => setItem(i, "unitPrice", e.target.value.replace(/\./g, ""))} aria-label="Đơn giá" className={`${input} h-8 px-2`} /></td>
                <td className="text-right font-bold">{discountedPrice(x.unitPrice, d).toLocaleString("vi-VN")}</td>
                <td className="text-right font-bold">{Math.round(x.quantity * x.unitPrice).toLocaleString("vi-VN")}</td>
                <td><button type="button" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} aria-label="Xóa dòng" className="text-[#a94442]"><X className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {t.fee > 0 && <tr><td colSpan={6} className="text-right">Phí quản lý {f.managementFeePct}%</td><td className="text-right">{t.fee.toLocaleString("vi-VN")}</td><td /></tr>}
            {t.discount > 0 && <tr><td colSpan={6} className="text-right">Giảm giá {f.discountPct}%</td><td className="text-right">−{t.discount.toLocaleString("vi-VN")}</td><td /></tr>}
            {t.vat > 0 && <tr><td colSpan={6} className="text-right">VAT {f.vatRate}%</td><td className="text-right">{t.vat.toLocaleString("vi-VN")}</td><td /></tr>}
            <tr><td colSpan={6} className="text-right font-bold">Tổng cộng</td><td className="text-right font-bold text-[#0000ff]">{t.total.toLocaleString("vi-VN")}</td><td /></tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-[#eee] pt-4">
        <label className="text-sm"><span className="mb-1 block font-bold">Loại mẫu</span>
          <select value={pickType} onChange={(e) => { setPickType(e.target.value); setPickAnalyte(""); }} className={`${input} !w-44`}>{types.map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        <label className="min-w-0 flex-1 text-sm"><span className="mb-1 block font-bold">Chỉ tiêu</span>
          <select value={pickAnalyte} onChange={(e) => setPickAnalyte(e.target.value)} className={input}>
            <option value="" />
            {ofType.map((c) => <option key={c.analyte} value={c.analyte}>{c.analyte}</option>)}
          </select>
        </label>
        <label className="text-sm"><span className="mb-1 block font-bold">Số lượng</span><input type="number" min={1} value={pickQty} onChange={(e) => setPickQty(e.target.value)} className={`${input} !w-20`} /></label>
        <button type="button" onClick={() => addAnalyte()} className="inline-flex h-[34px] items-center rounded border border-[#4cae4c] bg-[#5cb85c] px-3 text-sm text-white hover:bg-[#449d44]">Thêm</button>
        <button type="button" onClick={() => addAnalyte(true)} className={btnPrimary}>Thêm tất cả</button>
        <label className="text-sm sm:ml-4"><span className="mb-1 block font-bold">Chi phí khác</span>
          <select value={extra} onChange={(e) => setExtra(e.target.value)} className={`${input} !w-44`}>{EXTRA_COSTS.map((e) => <option key={e.label}>{e.label}</option>)}</select>
        </label>
        <button type="button" onClick={addExtra} className={btn}>Thêm khoản</button>
      </div>

      <hr className="my-5 border-[#eee]" />
      <div className="flex flex-wrap items-center gap-1">
        <Link href={backHref} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
        <button type="button" disabled={Boolean(busy)} onClick={() => save(true)} className={btnPrimary}>{busy === "exit" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
        <button type="button" disabled={Boolean(busy)} onClick={() => save(false)} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
        <span className="mx-1 text-[#333]">|</span>
        <Dropdown className={btn} label={<><Printer className="h-4 w-4" aria-hidden />In ấn</>} items={[{ label: "Báo giá", href: `/order-print/${orderId}?loai=bao-gia&v=${quote.id}` }]} />
        <button type="button" disabled={Boolean(busy) || applied} onClick={applyToOrder} className={btn} title="Dùng tổng của báo giá này làm giá trị đơn hàng (Công nợ)">{applied ? "Đang là giá trị đơn hàng" : "Chốt làm giá trị đơn hàng"}</button>
      </div>
    </div>
  );
}
