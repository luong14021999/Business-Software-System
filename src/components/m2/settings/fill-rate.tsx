"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btn, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** Nạp mọi chỉ tiêu của một loại mẫu vào bảng giá / định mức (bỏ qua chỉ tiêu đã có). */
export function FillRate({ listId, types }: { listId: string; types: { id: string; name: string }[] }) {
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  async function fill() {
    setBusy(true);
    const res = await fetch(`/api/rate-lists/${listId}/fill`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sampleTypeId: typeId }) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không nạp được", b.error ?? `HTTP ${res.status}`);
    toast.success(b.added ? `Đã thêm ${b.added} chỉ tiêu` : "Loại mẫu này đã có đủ chỉ tiêu trong bảng");
    start(() => router.refresh());
  }
  return (
    <div className="flex">
      <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={`${input} !w-44 rounded-r-none`} aria-label="Loại mẫu cần nạp">
        {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <button type="button" onClick={fill} disabled={busy || !typeId} className={`${btn} rounded-l-none border-l-0`}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Nạp chỉ tiêu của loại mẫu</button>
    </div>
  );
}
