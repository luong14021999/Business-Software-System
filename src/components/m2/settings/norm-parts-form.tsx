"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { XSaveBar } from "@/components/m2/lab-ui/x-save";
import { btn, input, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Part = { category: string; name: string; quantity: string; unitPrice: string };
type Other = { id: string; sampleTypeId: string; analyte: string };

/**
 * "Cài đặt định mức" của một chỉ tiêu như XaLab: 7 tab khoản (dụng cụ lấy mẫu, thiết bị HT, vật liệu HT, dụng cụ phân tích,
 * thiết bị PTN, vật liệu PTN, nhân công), mỗi khoản Tên – Định mức – Đơn giá; copy dữ liệu từ chỉ tiêu khác trong bảng.
 */
export function NormPartsForm({ itemId, backHref, categories, options, initial, others, types, canWrite }: { itemId: string; backHref: string; categories: string[]; options: Record<string, string[]>; initial: Part[]; others: Other[]; types: { value: string; label: string }[]; canWrite: boolean }) {
  const [tab, setTab] = useState(categories[0]);
  const [parts, setParts] = useState<Part[]>(initial);
  const [pick, setPick] = useState("");
  const [copyType, setCopyType] = useState("");
  const [copyFrom, setCopyFrom] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();
  const mine = parts.map((p, i) => ({ ...p, i })).filter((p) => p.category === tab);
  const total = parts.reduce((s, p) => s + (Number(p.quantity.replace(",", ".")) || 0) * (Number(p.unitPrice.replace(/\./g, "").replace(",", ".")) || 0), 0);
  async function save(exit: boolean) {
    setBusy(exit ? "exit" : "save");
    const res = await fetch(`/api/rate-items/${itemId}/parts`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parts }) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu định mức", `Đơn giá định mức: ${Number(b.total).toLocaleString("vi-VN")} đ`);
    if (exit) router.push(backHref);
    else router.refresh();
  }
  async function copy() {
    if (!copyFrom) return toast.error("Chọn chỉ tiêu để copy");
    const res = await fetch(`/api/rate-items/${copyFrom}/parts`);
    const b = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không đọc được", b.error ?? `HTTP ${res.status}`);
    setParts((b.items as { category: string; name: string; quantity: number; unitPrice: number }[]).map((p) => ({ category: p.category, name: p.name, quantity: String(p.quantity).replace(".", ","), unitPrice: String(p.unitPrice) })));
    toast.success("Đã copy – kiểm tra rồi bấm Lưu");
  }
  const tabCls = (on: boolean) => `-mb-px block rounded-t border px-3 py-[10px] text-sm ${on ? "border-[#ddd] border-b-transparent bg-[linear-gradient(#f5fafd,#e8f3fa)] text-[#333]" : "border-transparent text-[#337ab7] hover:bg-[#eee]"}`;
  const labour = tab === "Nhân công";
  return (
    <div className="space-y-[15px]">
      {canWrite && (
        <div className="rounded border border-[#ddd] bg-[#f9f9f9] p-3">
          <div className="mb-2 text-sm font-bold">Copy dữ liệu từ chỉ tiêu khác</div>
          <div className="flex flex-wrap items-center gap-1">
            <select value={copyType} onChange={(e) => { setCopyType(e.target.value); setCopyFrom(""); }} aria-label="Loại mẫu" className={`${input} !w-56`}>
              <option value="">Chọn loại mẫu</option>
              {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} aria-label="Chỉ tiêu" className={`${input} !w-80`}>
              <option value="" />
              {others.filter((o) => o.sampleTypeId === copyType).map((o) => <option key={o.id} value={o.id}>{o.analyte}</option>)}
            </select>
            <button type="button" onClick={copy} className={btn}>Copy</button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap border-b border-[#ddd]">
        {categories.map((c) => <button key={c} type="button" className={tabCls(tab === c)} onClick={() => { setTab(c); setPick(""); }}>{c} ({parts.filter((p) => p.category === c).length})</button>)}
      </div>
      <fieldset disabled={!canWrite} className="space-y-[15px]">
        <div className="flex flex-wrap items-center gap-1">
          {labour ? (
            <input value={pick} onChange={(e) => setPick(e.target.value)} placeholder="VD: Kỹ thuật viên bậc 3 (công)" aria-label="Nhân công" className={`${input} !w-80`} />
          ) : (
            <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={tab} className={`${input} !w-96`}>
              <option value="">Chọn dụng cụ</option>
              {(options[tab] ?? []).filter((o) => !mine.some((p) => p.name === o)).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          <button type="button" className={btn} disabled={!pick.trim()} onClick={() => { setParts((ps) => [...ps, { category: tab, name: pick.trim(), quantity: "1", unitPrice: "" }]); setPick(""); }}>Thêm</button>
        </div>
        <table className={table}>
          <thead><tr><th>Tên</th><th>Định mức</th><th>Đơn giá (đ)</th><th className="text-right">Thành tiền (đ)</th><th /></tr></thead>
          <tbody>
            {mine.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Chưa có</td></tr>}
            {mine.map((p) => (
              <tr key={p.i}>
                <td>{p.name}</td>
                <td><input value={p.quantity} inputMode="decimal" onChange={(e) => setParts((ps) => ps.map((x, k) => (k === p.i ? { ...x, quantity: e.target.value } : x)))} aria-label={`Định mức ${p.name}`} className={`${input} h-[30px] !w-28 px-2`} /></td>
                <td><input value={p.unitPrice} inputMode="numeric" onChange={(e) => setParts((ps) => ps.map((x, k) => (k === p.i ? { ...x, unitPrice: e.target.value } : x)))} aria-label={`Đơn giá ${p.name}`} className={`${input} h-[30px] !w-36 px-2`} /></td>
                <td className="text-right">{((Number(p.quantity.replace(",", ".")) || 0) * (Number(p.unitPrice.replace(/\./g, "").replace(",", ".")) || 0)).toLocaleString("vi-VN")}</td>
                <td className="text-right"><button type="button" onClick={() => setParts((ps) => ps.filter((_, k) => k !== p.i))} aria-label={`Bỏ ${p.name}`} className="text-[#a94442]"><X className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-sm font-bold">Đơn giá định mức (tổng các khoản): {Math.round(total).toLocaleString("vi-VN")} đ</div>
      </fieldset>
      <hr className="border-[#eee]" />
      <XSaveBar backHref={backHref} canWrite={canWrite} busy={busy} save={(exit) => void save(exit)} />
    </div>
  );
}
