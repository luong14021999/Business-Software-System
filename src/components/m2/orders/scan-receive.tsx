"use client";

import { useRef, useState } from "react";
import { Loader2, ScanLine, X } from "lucide-react";
import { btnPrimary, input, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Item = { code: string; locationName?: string; type?: string; stage?: string; customer?: string; missing?: boolean };
const RECEIVABLE = ["", "Đợi lấy mẫu", "Lấy mẫu"];

/** Quét mã vạch / QR trên tem mẫu (máy quét gõ mã + Enter) rồi chuyển cả lượt sang "Nhận mẫu". */
export function ScanReceive() {
  const [code, setCode] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function scan() {
    const c = code.trim().toUpperCase();
    setCode("");
    ref.current?.focus();
    if (!c) return;
    if (items.some((i) => i.code.toUpperCase() === c)) return toast.error(`Mã ${c} đã quét`);
    const res = await fetch(`/api/samples-receive?code=${encodeURIComponent(c)}`);
    const b = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không tra cứu được mã", b.error ?? `HTTP ${res.status}`);
    const it = (b.items?.[0] ?? { code: c, missing: true }) as Item;
    if (it.missing) toast.error(`Không có mẫu mã ${c}`);
    setItems((x) => [it, ...x]);
  }

  async function receive() {
    const codes = items.filter((i) => !i.missing && RECEIVABLE.includes(i.stage ?? "")).map((i) => i.code);
    if (!codes.length) return toast.error("Không có mẫu nào chờ nhận trong danh sách");
    setBusy(true);
    const res = await fetch("/api/samples-receive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codes }) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không nhận được mẫu", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã nhận ${b.done.length} mẫu`, b.skipped.length ? `Bỏ qua: ${b.skipped.join(", ")}` : undefined);
    setItems((x) => x.map((i) => (b.done.includes(i.code) ? { ...i, stage: "Nhận mẫu" } : i)));
    ref.current?.focus();
  }

  const waiting = items.filter((i) => !i.missing && RECEIVABLE.includes(i.stage ?? "")).length;
  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); scan(); }} className="flex max-w-xl items-center gap-2">
        <label htmlFor="scan" className="whitespace-nowrap text-sm font-bold">Quét mã yêu cầu:</label>
        <input id="scan" ref={ref} autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="Quét hoặc gõ mã mẫu rồi nhấn Enter" className={`${input} font-mono`} autoComplete="off" />
        <button className={btnPrimary} aria-label="Thêm mã"><ScanLine className="h-4 w-4" /></button>
      </form>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead><tr><th>#</th><th>Mã yêu cầu</th><th>Vị trí lấy mẫu</th><th>Loại mẫu</th><th>Khách hàng</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Chưa quét mã nào</td></tr>}
            {items.map((i, n) => (
              <tr key={i.code} className={i.missing ? "bg-[#f2dede]" : undefined}>
                <td>{items.length - n}</td>
                <td className="font-mono">{i.code}</td>
                <td>{i.missing ? "Không tìm thấy mẫu" : i.locationName}</td>
                <td>{i.type}</td>
                <td>{i.customer}</td>
                <td className={i.stage === "Nhận mẫu" ? "text-teal-700" : ""}>{i.missing ? "—" : i.stage || "Chưa có trạng thái"}</td>
                <td><button type="button" onClick={() => setItems((x) => x.filter((y) => y.code !== i.code))} aria-label={`Bỏ ${i.code}`} className="text-muted-foreground hover:text-[#a94442]"><X className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" disabled={busy || !waiting} onClick={receive} className={btnPrimary}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}Chuyển {waiting || ""} mẫu sang trạng thái nhận mẫu
      </button>
    </div>
  );
}
