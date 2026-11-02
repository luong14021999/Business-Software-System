"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Printer, X } from "lucide-react";
import { btn, btnPrimary, btnXs, input, link, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { EXTRA_COSTS, quoteItemsTotal, type QuoteItem } from "@/lib/modules/m2/orders";
import { fmtVND } from "@/lib/platform/format";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

/** Dòng đang soạn; `key` = "loại mẫu|chỉ tiêu" để áp đơn giá theo bảng giá. */
export type EditItem = QuoteItem & { key?: string };
type Version = { id: string; code: string; kind: string; quotedAt: string; total: number; createdBy: string; lines: QuoteItem[] };

/**
 * Soạn báo giá: bảng kê sửa được (số lượng, đơn giá), áp bảng giá, thêm chi phí khác,
 * giảm giá + thuế → lưu thành một phiên bản; chốt phiên bản làm giá trị đơn hàng.
 * `kind = "before"`: báo giá trước bóc tách – tự chọn loại mẫu, chỉ tiêu, số lượng.
 */
export function QuoteEditor({
  orderId,
  kind,
  initialItems,
  priceLists,
  prices,
  catalog,
  versions,
  defaults,
  appliedCode,
}: {
  orderId: string;
  kind: "after" | "before";
  initialItems: EditItem[];
  priceLists: { id: string; name: string }[];
  prices: Record<string, Record<string, number>>;
  catalog: { typeName: string; analyte: string; unit: string }[];
  versions: Version[];
  defaults: { discountPct: number; vatRate: number };
  appliedCode: string;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [items, setItems] = useState<EditItem[]>(initialItems);
  const [listId, setListId] = useState("");
  const [discountPct, setDiscount] = useState(String(defaults.discountPct || ""));
  const [vatRate, setVat] = useState(String(defaults.vatRate || ""));
  const [quotedAt, setQuotedAt] = useState(todayISO());
  const [note, setNote] = useState("");
  const [extra, setExtra] = useState<string>(EXTRA_COSTS[0].label);
  const [pickType, setPickType] = useState(catalog[0]?.typeName ?? "");
  const [pickAnalyte, setPickAnalyte] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [busy, setBusy] = useState<string | null>(null);

  const types = useMemo(() => [...new Set(catalog.map((c) => c.typeName))], [catalog]);
  const ofType = catalog.filter((c) => c.typeName === pickType);
  const t = quoteItemsTotal(items, Number(discountPct) || 0, Number(vatRate) || 0);
  const setItem = (i: number, k: keyof EditItem, v: string) =>
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: k === "quantity" || k === "unitPrice" ? Number(v.replace(/[^\d.]/g, "")) || 0 : v } : x)));
  const priceFor = (key: string) => prices[listId]?.[key] ?? prices[""]?.[key] ?? 0;

  function applyList() {
    let n = 0;
    setItems((xs) =>
      xs.map((x) => {
        if (!x.key) return x;
        const p = prices[listId]?.[x.key];
        if (p == null) return x;
        n++;
        return { ...x, unitPrice: p };
      }),
    );
    toast.success(listId ? `Đã áp đơn giá cho ${n} dòng` : "Chọn bảng giá cần áp");
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

  async function save() {
    setBusy("save");
    const res = await fetch("/api/order-quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, kind, quotedAt, discountPct: Number(discountPct) || 0, vatRate: Number(vatRate) || 0, note, lines: items.map((x) => ({ label: x.label, unit: x.unit, quantity: x.quantity, unitPrice: x.unitPrice, group: x.group })) }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được báo giá", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã lưu báo giá ${b.item.code}`);
    start(() => router.refresh());
  }
  async function apply(v: Version) {
    setBusy(v.id);
    const res = await fetch(`/api/order-quotes/${v.id}/apply`, { method: "POST" });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không chốt được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã chốt ${v.code} làm giá trị đơn hàng`, fmtVND(b.total));
    start(() => router.refresh());
  }
  async function remove(v: Version) {
    if (!confirm(`Xóa phiên bản báo giá ${v.code}?`)) return;
    const res = await fetch(`/api/order-quotes/${v.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Không xóa được", (await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    start(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm"><span className="mb-1 block font-bold">Giảm giá đơn hàng %</span><input inputMode="decimal" value={discountPct} onChange={(e) => setDiscount(e.target.value)} className={`${input} !w-24`} /></label>
        <label className="text-sm"><span className="mb-1 block font-bold">VAT %</span><input inputMode="decimal" value={vatRate} onChange={(e) => setVat(e.target.value)} className={`${input} !w-24`} /></label>
        <label className="text-sm"><span className="mb-1 block font-bold">Ngày báo giá</span><input type="date" value={quotedAt} onChange={(e) => setQuotedAt(e.target.value)} className={`${input} !w-40`} /></label>
        <label className="text-sm"><span className="mb-1 block font-bold">Bảng giá</span>
          <select value={listId} onChange={(e) => setListId(e.target.value)} className={`${input} !w-56`}>
            <option value="">— Chọn bảng giá —</option>
            {priceLists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
        <button type="button" onClick={applyList} disabled={!listId} className={btnPrimary}>Áp dụng bảng giá</button>
      </div>
      <label className="block text-sm"><span className="mb-1 block font-bold">Ghi chú</span><input value={note} onChange={(e) => setNote(e.target.value)} className={input} /></label>

      <div className="overflow-x-auto">
        <table className={table}>
          <thead><tr><th>#</th><th>Chỉ tiêu / khoản mục</th><th>Đơn vị</th><th className="w-24">Số lượng</th><th className="w-36">Đơn giá (đồng)</th><th className="text-right">Thành tiền</th><th /></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">{kind === "before" ? "Chọn loại mẫu, chỉ tiêu và số lượng ở dưới" : "Đơn hàng chưa bóc tách – dùng Báo giá trước bóc tách"}</td></tr>}
            {items.map((x, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  {x.group && <span className="mr-1.5 rounded bg-[#5bc0de] px-1.5 py-px text-[10px] font-bold text-white">{x.group}</span>}
                  {x.key ? x.label : <input value={x.label} onChange={(e) => setItem(i, "label", e.target.value)} className={`${input} inline-block h-8 !w-64`} aria-label="Khoản mục" />}
                </td>
                <td><input value={x.unit} onChange={(e) => setItem(i, "unit", e.target.value)} className={`${input} h-8 !w-28 px-2`} aria-label="Đơn vị" /></td>
                <td><input inputMode="decimal" value={x.quantity || ""} onChange={(e) => setItem(i, "quantity", e.target.value)} className={`${input} h-8 px-2`} aria-label="Số lượng" /></td>
                <td><input inputMode="numeric" value={x.unitPrice ? x.unitPrice.toLocaleString("vi-VN") : ""} onChange={(e) => setItem(i, "unitPrice", e.target.value.replace(/\./g, ""))} className={`${input} h-8 px-2 ${x.unitPrice ? "" : "border-[#ebccd1]"}`} aria-label="Đơn giá" /></td>
                <td className="whitespace-nowrap text-right">{fmtVND(Math.round(x.quantity * x.unitPrice))}</td>
                <td><button type="button" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} aria-label="Xóa dòng" className="text-[#a94442]"><X className="h-4 w-4" /></button></td>
              </tr>
            ))}
            <tr><td colSpan={5} className="text-right">Cộng trước thuế</td><td className="text-right">{fmtVND(t.sub)}</td><td /></tr>
            {t.discount > 0 && <tr><td colSpan={5} className="text-right">Giảm giá {discountPct}%</td><td className="text-right">− {fmtVND(t.discount)}</td><td /></tr>}
            <tr><td colSpan={5} className="text-right">VAT {vatRate || 0}%</td><td className="text-right">{fmtVND(t.vat)}</td><td /></tr>
            <tr><td colSpan={5} className="text-right font-bold">Tổng cộng</td><td className="text-right font-bold">{fmtVND(t.total)}</td><td /></tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-y border-[#e5e5e5] py-3">
        <label className="text-sm"><span className="mb-1 block font-bold">Loại mẫu</span>
          <select value={pickType} onChange={(e) => { setPickType(e.target.value); setPickAnalyte(""); }} className={`${input} !w-44`}>
            {types.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="min-w-0 flex-1 text-sm"><span className="mb-1 block font-bold">Chỉ tiêu</span>
          <select value={pickAnalyte} onChange={(e) => setPickAnalyte(e.target.value)} className={input}>
            <option value="">— Chọn chỉ tiêu ({ofType.length}) —</option>
            {ofType.map((c) => <option key={c.analyte} value={c.analyte}>{c.analyte}</option>)}
          </select>
        </label>
        <label className="text-sm"><span className="mb-1 block font-bold">Số lượng</span><input type="number" min={1} value={pickQty} onChange={(e) => setPickQty(e.target.value)} className={`${input} !w-20`} /></label>
        <button type="button" onClick={() => addAnalyte()} className="inline-flex h-[34px] items-center rounded border border-[#4cae4c] bg-[#5cb85c] px-3 text-sm text-white hover:bg-[#449d44]">Thêm</button>
        <button type="button" onClick={() => addAnalyte(true)} className={btnPrimary}>Thêm tất cả</button>
        <span className="mx-2 hidden h-8 border-l border-[#ddd] sm:block" />
        <label className="text-sm"><span className="mb-1 block font-bold">Chi phí khác</span>
          <select value={extra} onChange={(e) => setExtra(e.target.value)} className={`${input} !w-48`}>
            {EXTRA_COSTS.map((e) => <option key={e.label}>{e.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={addExtra} className={btn}>Thêm khoản</button>
      </div>

      <button type="button" onClick={save} disabled={busy === "save" || !items.length} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu phiên bản báo giá</button>

      <section>
        <h2 className="text-xl font-medium">Danh sách báo giá của đơn hàng</h2>
        <div className="mt-2 overflow-x-auto">
          <table className={table}>
            <thead><tr><th>Số báo giá</th><th>Loại</th><th>Ngày báo giá</th><th className="text-right">Tổng cộng</th><th>Người lập</th><th /></tr></thead>
            <tbody>
              {versions.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Chưa lưu phiên bản nào</td></tr>}
              {versions.map((v) => (
                <tr key={v.id}>
                  <td className="whitespace-nowrap">
                    <Link href={`/order-print/${orderId}?loai=bao-gia&v=${v.id}`} className={link}>{v.code}</Link>
                    {v.code === appliedCode && <span className="ml-1.5 rounded bg-[#dff0d8] px-1.5 text-[11px] text-[#3c763d]">đang áp dụng</span>}
                  </td>
                  <td>{v.kind === "before" ? "Trước bóc tách" : "Sau bóc tách"}</td>
                  <td>{fmtDateVN(v.quotedAt)}</td>
                  <td className="whitespace-nowrap text-right">{fmtVND(v.total)}</td>
                  <td>{v.createdBy}</td>
                  <td className="whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setItems(v.lines.map((l) => ({ ...l })))} className={btnXs}>Mở lại</button>
                      <button type="button" onClick={() => apply(v)} disabled={busy === v.id} className={btnXs}>Chốt làm giá trị đơn</button>
                      <Link href={`/order-print/${orderId}?loai=bao-gia&v=${v.id}`} className={btnXs}><Printer className="h-3 w-3" />In</Link>
                      <button type="button" onClick={() => remove(v)} className={`${btnXs} text-[#a94442]`}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
