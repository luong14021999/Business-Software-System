"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btnPrimary, btnXs, input, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Row = { sampleTypeId: string; typeName: string; prefix: string; samples: number; spec1Id: string; spec2Id: string };

/** Quy chuẩn theo loại mẫu của đơn (tối đa 2 cột in trên phiếu) và nút áp cho tất cả yêu cầu. */
export function TypeSpecs({ orderId, rows, specs }: { orderId: string; rows: Row[]; specs: { id: string; label: string; sampleTypeId: string }[] }) {
  const [state, setState] = useState(rows);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const opts = (typeId: string) => specs.filter((s) => !s.sampleTypeId || s.sampleTypeId === typeId);
  const set = (typeId: string, k: "spec1Id" | "spec2Id", v: string) => setState((xs) => xs.map((x) => (x.sampleTypeId === typeId ? { ...x, [k]: v } : x)));

  async function save(r: Row) {
    setBusy(r.sampleTypeId);
    const res = await fetch(`/api/orders/${orderId}/type-specs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sampleTypeId: r.sampleTypeId, spec1Id: r.spec1Id, spec2Id: r.spec2Id }) });
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được", (await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    toast.success(`Đã lưu quy chuẩn cho ${r.typeName}`);
  }
  async function applyAll() {
    setBusy("all");
    for (const r of state) {
      await fetch(`/api/orders/${orderId}/type-specs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sampleTypeId: r.sampleTypeId, spec1Id: r.spec1Id, spec2Id: r.spec2Id }) });
    }
    const res = await fetch(`/api/orders/${orderId}/type-specs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apply: true }) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không áp được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã áp quy chuẩn cho ${b.applied} yêu cầu`);
    start(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={applyAll} disabled={busy === "all"} className={btnPrimary}>{busy === "all" && <Loader2 className="h-4 w-4 animate-spin" />}Áp quy chuẩn cho tất cả yêu cầu</button>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead><tr><th>Loại mẫu</th><th>Tiền tố</th><th>Số yêu cầu</th><th>Cột quy chuẩn 1</th><th>Cột quy chuẩn 2</th><th /></tr></thead>
          <tbody>
            {state.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Đơn hàng chưa có yêu cầu – bóc tách trước</td></tr>}
            {state.map((r) => (
              <tr key={r.sampleTypeId}>
                <td>{r.typeName}</td>
                <td className="font-mono">{r.prefix}</td>
                <td>{r.samples}</td>
                {(["spec1Id", "spec2Id"] as const).map((k) => (
                  <td key={k}>
                    <select value={r[k]} onChange={(e) => set(r.sampleTypeId, k, e.target.value)} className={`${input} h-8 !w-72 px-2`} aria-label={`${k === "spec1Id" ? "Cột quy chuẩn 1" : "Cột quy chuẩn 2"} – ${r.typeName}`}>
                      <option value="">— Chọn cột quy chuẩn —</option>
                      {opts(r.sampleTypeId).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </td>
                ))}
                <td><button type="button" onClick={() => save(r)} disabled={busy === r.sampleTypeId} className={btnXs}>Lưu</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Phiếu kết quả in tối đa 2 cột quy chuẩn. Mẫu bóc tách sau khi đã lưu quy chuẩn ở đây sẽ tự nhận quy chuẩn theo loại mẫu.</p>
    </div>
  );
}
