"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { btn, btnPrimary, input, link, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Row = { fieldDay: string; fieldMonth: string };

/** Lịch quan trắc định kỳ của địa điểm như XaLab: mỗi dòng một đợt (ngày / tháng hằng năm). */
export function ScheduleEditor({ locationId, initial, backHref, canWrite }: { locationId: string; initial: Row[]; backHref: string; canWrite: boolean }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const set = (i: number, k: keyof Row, v: string) => setRows((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  async function save(exit: boolean) {
    setBusy(exit ? "exit" : "save");
    const res = await fetch("/api/location-schedules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationId, rows }) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được lịch", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã lưu ${b.saved} đợt quan trắc`);
    if (exit) return start(() => router.push(backHref));
    start(() => router.refresh());
  }

  return (
    <div>
      <div className="mb-4 flex">
        <Link href={backHref} className={`${btn} rounded-r-none`} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
        {canWrite && <button type="button" onClick={() => setRows((xs) => [...xs, { fieldDay: "", fieldMonth: "" }])} className={`${btn} -ml-px rounded-l-none`}>Thêm đợt quan trắc <Plus className="h-4 w-4 stroke-[3]" /></button>}
      </div>
      <table className={table}>
        <thead><tr><th className="w-1/4" /><th className="w-1/4">Ngày quan trắc</th><th className="w-1/4">Tháng quan trắc</th><th /></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="text-right text-muted-foreground">Đợt {i + 1}</td>
              <td><input type="number" min={1} max={31} disabled={!canWrite} value={r.fieldDay} onChange={(e) => set(i, "fieldDay", e.target.value)} aria-label={`Ngày đợt ${i + 1}`} className={`${input} !w-28`} /></td>
              <td><input type="number" min={1} max={12} disabled={!canWrite} value={r.fieldMonth} onChange={(e) => set(i, "fieldMonth", e.target.value)} aria-label={`Tháng đợt ${i + 1}`} className={`${input} !w-28`} /></td>
              <td>{canWrite && <button type="button" onClick={() => setRows((xs) => xs.filter((_, j) => j !== i))} className={`${link} inline-flex items-center gap-0.5`}>Xóa <X className="h-3.5 w-3.5 stroke-[3]" aria-hidden /></button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-5 border-[#eee]" />
      <div className="flex gap-1">
        <Link href={backHref} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
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
