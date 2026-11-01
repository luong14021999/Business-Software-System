"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btn, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** Tạo giới hạn cột này từ cột quy chuẩn có sẵn × công thức (VD Cmax = C × 0,9 × 1,2). */
export function DeriveSpec({ specId, sources }: { specId: string; sources: { id: string; label: string }[] }) {
  const [sourceId, setSourceId] = useState("");
  const [formula, setFormula] = useState("");
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  async function run() {
    if (!confirm("Ghi đè giới hạn các chỉ tiêu trùng tên trong cột này bằng giá trị tính từ cột nguồn?")) return;
    setBusy(true);
    const res = await fetch(`/api/specifications/${specId}/derive`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceId, formula }) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không tính được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã tính ${b.count} chỉ tiêu`, "Kiểm tra lại các chỉ tiêu quy chuẩn giữ nguyên giá trị C và sửa tay nếu cần");
    start(() => router.refresh());
  }
  return (
    <div className="rounded border border-[#ddd] bg-[#f9f9f9] p-3">
      <div className="mb-2 text-sm font-bold">Tạo giá trị bằng công thức từ cột quy chuẩn khác</div>
      <div className="flex flex-wrap items-center gap-1.5">
        <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={`${input} !w-72`} aria-label="Cột quy chuẩn dùng để tính toán">
          <option value="">— Cột quy chuẩn dùng để tính toán —</option>
          {sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <input value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="VD: *0,9*1,2" className={`${input} !w-40 font-mono`} aria-label="Công thức" />
        <button type="button" onClick={run} disabled={busy || !sourceId || !formula.trim()} className={btn}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Tính toán</button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Chỉ nhận phép nhân / chia số. Theo quy chuẩn, một số chỉ tiêu giữ nguyên giá trị C – sửa tay sau khi tính.</p>
    </div>
  );
}
