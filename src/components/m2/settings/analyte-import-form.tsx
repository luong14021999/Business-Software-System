"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { btnPrimary } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** Ô chọn file + nút Upload; hiện số chỉ tiêu thêm / cập nhật và lỗi từng dòng. */
export function AnalyteImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number; errors: string[] } | null>(null);
  async function upload() {
    if (!file) return toast.error("Chọn file");
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/lab-analytes/import", { method: "POST", body: fd });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không nhập được", b.error ?? `HTTP ${res.status}`);
    setResult(b);
    toast.success(`Đã thêm ${b.added}, cập nhật ${b.updated} chỉ tiêu`);
  }
  return (
    <div className="space-y-3">
      <label className="grid items-center gap-1 sm:grid-cols-[165px_1fr] sm:gap-x-[30px]">
        <span className="text-sm font-bold sm:text-right">File Excel</span>
        <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <div className="sm:pl-[195px]"><button type="button" disabled={busy} onClick={upload} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Upload</button></div>
      {result && (
        <div className="rounded border border-[#d6e9c6] bg-[#dff0d8] p-3 text-sm text-[#3c763d]">
          Đã thêm {result.added}, cập nhật {result.updated} chỉ tiêu.
          {result.errors.length > 0 && <ul className="mt-2 list-disc pl-5 text-[#a94442]">{result.errors.slice(0, 50).map((e) => <li key={e}>{e}</li>)}</ul>}
        </div>
      )}
    </div>
  );
}
