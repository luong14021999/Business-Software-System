"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { btn, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Opt = { value: string; label: string };

/** Thêm chỉ tiêu vào bảng định mức như XaLab: Loại mẫu → Chỉ tiêu, [Thêm] [Thêm tất cả]. */
export function NormAdd({ listId, types, analytes, existing }: { listId: string; types: Opt[]; analytes: { name: string; sampleTypeId: string }[]; existing: string[] }) {
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const have = new Set(existing);
  const pool = analytes.filter((a) => a.sampleTypeId === type && !have.has(`${type}|${a.name.toLowerCase()}`));
  async function post(url: string, body: unknown) {
    setBusy(true);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không thêm được", b.error ?? `HTTP ${res.status}`);
    toast.success(b.added != null ? `Đã thêm ${b.added} chỉ tiêu` : "Đã thêm");
    setName("");
    start(() => router.refresh());
  }
  return (
    <div className="mt-6 grid max-w-2xl gap-[15px] border-t border-[#eee] pt-4">
      <label className="grid items-center gap-1 sm:grid-cols-[165px_1fr] sm:gap-x-[30px]">
        <span className="text-sm font-bold sm:text-right">Loại mẫu</span>
        <select value={type} onChange={(e) => { setType(e.target.value); setName(""); }} className={input}>
          <option value="">Chọn loại mẫu</option>
          {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
      <label className="grid items-center gap-1 sm:grid-cols-[165px_1fr] sm:gap-x-[30px]">
        <span className="text-sm font-bold sm:text-right">Chỉ tiêu</span>
        <select value={name} onChange={(e) => setName(e.target.value)} className={input}>
          <option value="" />
          {pool.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
        </select>
      </label>
      <div className="flex gap-1 sm:pl-[195px]">
        <button type="button" disabled={busy || !type || !name} onClick={() => post("/api/rate-items", { listId, sampleTypeId: type, analyte: name, amount: 0, cost: null })} className={btn}>Thêm</button>
        <button type="button" disabled={busy || !type || !pool.length} onClick={() => post(`/api/rate-lists/${listId}/fill`, { sampleTypeId: type })} className={btn}>Thêm tất cả</button>
      </div>
    </div>
  );
}
