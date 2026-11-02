"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { btn, btnPrimary, input, link } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Row = { id?: string; amount: string; paidAt: string; note: string };

/** Cài đặt thanh toán như XaLab: các đợt (số tiền, ngày, ghi chú) sửa trực tiếp, tổng đã trả và còn lại. */
export function DebitEditor({ orderId, total, initial, canWrite }: { orderId: string; total: number; initial: Row[]; canWrite: boolean }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const num = (s: string) => Number(String(s).replace(/[.\s]/g, "").replace(",", ".")) || 0;
  const paid = rows.reduce((s, r) => s + num(r.amount), 0);
  const set = (i: number, k: keyof Row, v: string) => setRows((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  async function save(exit: boolean) {
    setBusy(exit ? "exit" : "save");
    const res = await fetch("/api/order-payments/sync", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, rows }) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được thanh toán", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã lưu ${b.rows} đợt thanh toán`);
    if (exit) return start(() => router.push("/orders"));
    start(() => router.refresh());
  }

  const th = "border-b-2 border-[#ddd] px-2 py-2 text-left font-bold";
  const td = "border-t border-[#ddd] px-2 py-2";
  return (
    <div>
      {canWrite && <button type="button" onClick={() => setRows((xs) => [...xs, { amount: "", paidAt: "", note: "" }])} className="ml-[15px] inline-flex h-[34px] items-center rounded border border-[#46b8da] bg-[#5bc0de] px-3 text-sm text-white hover:bg-[#31b0d5]">Thêm đợt</button>}
      <table className="mt-3 w-full border-collapse text-sm text-[#333]">
        <thead><tr><th className={`${th} w-1/2`} /><th className={th}>Số tiền</th><th className={th}>Ngày thanh toán</th><th className={th}>Ghi chú</th><th className={th} /></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className={`${td} text-right text-muted-foreground`}>Đợt {i + 1}</td>
              <td className={td}><input disabled={!canWrite} inputMode="numeric" value={r.amount} onChange={(e) => set(i, "amount", e.target.value)} aria-label={`Số tiền đợt ${i + 1}`} className={`${input} h-8`} /></td>
              <td className={td}><input disabled={!canWrite} type="date" value={r.paidAt} onChange={(e) => set(i, "paidAt", e.target.value)} aria-label={`Ngày thanh toán đợt ${i + 1}`} className={`${input} h-8`} /></td>
              <td className={td}><input disabled={!canWrite} value={r.note} onChange={(e) => set(i, "note", e.target.value)} aria-label={`Ghi chú đợt ${i + 1}`} className={`${input} h-8`} /></td>
              <td className={td}>{canWrite && <button type="button" onClick={() => setRows((xs) => xs.filter((_, j) => j !== i))} className={`${link} inline-flex items-center gap-0.5`}>Xóa <X className="h-3.5 w-3.5 stroke-[3]" /></button>}</td>
            </tr>
          ))}
          <tr><td className={`${td} font-bold`}>Số tiền thanh toán các đợt:</td><td className={`${td} font-bold`}>{paid.toLocaleString("vi-VN")}</td><td colSpan={3} /></tr>
          <tr><td className={`${td} font-bold text-[#0000ff]`}>Số tiền còn lại cần thanh toán:</td><td className={`${td} font-bold text-[#0000ff]`}>{Math.max(0, total - paid).toLocaleString("vi-VN")}</td><td colSpan={3} /></tr>
        </tbody>
      </table>
      <hr className="my-5 border-[#eee]" />
      <div className="flex gap-1">
        <Link href="/orders" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
        {canWrite && (
          <>
            <button type="button" disabled={Boolean(busy)} onClick={() => save(true)} className={btnPrimary}>{busy === "exit" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
            <button type="button" disabled={Boolean(busy)} onClick={() => save(false)} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
          </>
        )}
      </div>
    </div>
  );
}
