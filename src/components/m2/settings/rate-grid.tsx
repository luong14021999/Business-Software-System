"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XSaveBar } from "@/components/m2/lab-ui/x-save";
import { input, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Row = { analyte: string; unit: string; refPrice: number; amount: number | null; cost: number | null };
const show = (v: number | null) => (v == null ? "" : v.toLocaleString("vi-VN"));

/** Lưới giá các chỉ tiêu một loại mẫu: Đơn giá (và Giá vốn nếu bảng có giá vốn); ô Đơn giá trống = bỏ chỉ tiêu khỏi bảng giá. */
export function RateGrid({ listId, sampleTypeId, costPrice, rows, backHref, canWrite }: { listId: string; sampleTypeId: string; costPrice: boolean; rows: Row[]; backHref: string; canWrite: boolean }) {
  const [cells, setCells] = useState(rows.map((r) => ({ ...r, amount: show(r.amount), cost: show(r.cost) })));
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();
  async function save(exit: boolean) {
    setBusy(exit ? "exit" : "save");
    const res = await fetch(`/api/rate-lists/${listId}/items`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sampleTypeId, rows: cells.map((c) => ({ analyte: c.analyte, amount: c.amount, cost: c.cost })) }) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã lưu giá ${b.saved} chỉ tiêu`);
    if (exit) router.push(backHref);
    else router.refresh();
  }
  const set = (i: number, k: "amount" | "cost", v: string) => setCells((cs) => cs.map((c, j) => (j === i ? { ...c, [k]: v } : c)));
  return (
    <div className="space-y-[15px]">
      <fieldset disabled={!canWrite}>
        <table className={table}>
          <thead><tr><th>#</th><th>Chỉ tiêu</th><th>Đơn vị</th><th>Đơn giá tham khảo</th><th>Đơn giá (đ)</th>{costPrice && <th>Giá vốn (đ)</th>}</tr></thead>
          <tbody>
            {cells.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Loại mẫu chưa có chỉ tiêu</td></tr>}
            {cells.map((c, i) => (
              <tr key={c.analyte}>
                <td>{i + 1}</td><td>{c.analyte}</td><td>{c.unit}</td>
                <td className="text-right text-[#777]">{c.refPrice ? c.refPrice.toLocaleString("vi-VN") : ""}</td>
                <td><input value={c.amount} inputMode="numeric" onChange={(e) => set(i, "amount", e.target.value)} aria-label={`Đơn giá ${c.analyte}`} className={`${input} h-[30px] !w-36 px-2 text-right`} /></td>
                {costPrice && <td><input value={c.cost} inputMode="numeric" onChange={(e) => set(i, "cost", e.target.value)} aria-label={`Giá vốn ${c.analyte}`} className={`${input} h-[30px] !w-36 px-2 text-right`} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </fieldset>
      <hr className="border-[#eee]" />
      <XSaveBar backHref={backHref} canWrite={canWrite} busy={busy} save={(exit) => void save(exit)} />
    </div>
  );
}
