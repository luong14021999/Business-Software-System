"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btnPrimary, input, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

export type LotRow = { id: string; chemical: string; lotName: string; expiry: string; qtyIn: string; qtyOut: string; remaining: string; state: string; note: string; danger: boolean };

/** Bảng tồn kho hóa chất: tích chọn để Tiêu hủy, sửa ghi chú từng lô rồi Lưu ghi chú (như XaLab). */
export function LotTable({ rows, canWrite }: { rows: LotRow[]; canWrite: boolean }) {
  const [picked, setPicked] = useState(new Set<string>());
  const [notes, setNotes] = useState<Record<string, string>>(Object.fromEntries(rows.map((r) => [r.id, r.note])));
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  async function send(action: "dispose" | "notes") {
    if (action === "dispose" && !picked.size) return toast.error("Chọn hóa chất cần tiêu hủy");
    if (action === "dispose" && !confirm(`Tiêu hủy ${picked.size} lô hóa chất đã chọn? Lượng còn lại sẽ không được xuất kho nữa.`)) return;
    setBusy(action);
    const body = action === "dispose" ? { dispose: [...picked] } : { notes: rows.filter((r) => (notes[r.id] ?? "") !== r.note).map((r) => ({ id: r.id, note: notes[r.id] ?? "" })) };
    const res = await fetch("/api/chemical-lots", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    toast.success(action === "dispose" ? "Đã tiêu hủy" : "Đã lưu ghi chú");
    setPicked(new Set());
    start(() => router.refresh());
  }
  const all = rows.length > 0 && rows.every((r) => picked.has(r.id));
  return (
    <>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className="w-10"><input type="checkbox" checked={all} disabled={!canWrite} onChange={() => setPicked(all ? new Set() : new Set(rows.map((r) => r.id)))} aria-label="Chọn tất cả" /></th>
              <th>Hóa chất</th><th>Lô hàng</th><th>Ngày hết hạn</th><th>Lượng nhập kho</th><th>Lượng xuất kho</th><th>Tồn</th><th>Tình trạng</th><th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td><input type="checkbox" disabled={!canWrite} checked={picked.has(r.id)} onChange={() => setPicked((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} aria-label={`Chọn ${r.chemical}`} /></td>
                <td>{r.chemical}</td><td>{r.lotName}</td><td className="whitespace-nowrap">{r.expiry}</td>
                <td className="text-right">{r.qtyIn}</td><td className="text-right">{r.qtyOut}</td><td className="text-right font-bold">{r.remaining}</td>
                <td className={r.danger ? "text-[#a94442]" : undefined}>{r.state}</td>
                <td><input value={notes[r.id] ?? ""} disabled={!canWrite} onChange={(e) => setNotes((x) => ({ ...x, [r.id]: e.target.value }))} aria-label={`Ghi chú ${r.chemical}`} className={`${input} h-[30px] min-w-40`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canWrite && (
        <div className="mt-5 flex gap-1">
          <button type="button" disabled={Boolean(busy)} onClick={() => send("dispose")} className={btnPrimary}>{busy === "dispose" && <Loader2 className="h-4 w-4 animate-spin" />}Tiêu hủy</button>
          <button type="button" disabled={Boolean(busy)} onClick={() => send("notes")} className={btnPrimary}>{busy === "notes" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu ghi chú</button>
        </div>
      )}
    </>
  );
}
