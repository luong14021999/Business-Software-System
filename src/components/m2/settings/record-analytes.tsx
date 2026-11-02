"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Opt = { value: string; label: string };

/** Ô thêm chỉ tiêu vào biên bản thử nghiệm: chọn loại mẫu → chỉ tiêu; "Thêm tất cả" thêm mọi chỉ tiêu của loại mẫu. */
export function RecordAnalyteAdder({ recordId, types, analytes }: { recordId: string; types: Opt[]; analytes: (Opt & { typeId: string })[] }) {
  const [typeId, setTypeId] = useState("");
  const [analyteId, setAnalyteId] = useState("");
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const list = analytes.filter((a) => a.typeId === typeId);

  async function add(ids: string[]) {
    if (!ids.length) return toast.error(typeId ? "Chọn chỉ tiêu" : "Chọn loại mẫu");
    setBusy(true);
    const res = await fetch("/api/test-record-analytes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId, analyteIds: ids }) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không thêm được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã thêm ${b.added} chỉ tiêu`);
    setAnalyteId("");
    start(() => router.refresh());
  }

  return (
    <div className="mt-4 grid items-center gap-x-[30px] gap-y-3 sm:grid-cols-[165px_360px]">
      <span className="text-sm font-bold sm:text-right">Loại mẫu</span>
      <select value={typeId} onChange={(e) => { setTypeId(e.target.value); setAnalyteId(""); }} aria-label="Loại mẫu" className={input}>
        <option value="">Chọn loại mẫu</option>
        {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <span className="text-sm font-bold sm:text-right">Chỉ tiêu</span>
      <select value={analyteId} onChange={(e) => setAnalyteId(e.target.value)} aria-label="Chỉ tiêu" className={input}>
        <option value="" />
        {list.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>
      <span />
      <span className="flex gap-1">
        <button type="button" disabled={busy} onClick={() => add(analyteId ? [analyteId] : [])} className={btnPrimary}>Thêm</button>
        <button type="button" disabled={busy} onClick={() => add(list.map((a) => a.value))} className={btnPrimary}>Thêm tất cả</button>
      </span>
    </div>
  );
}
