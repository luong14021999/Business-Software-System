"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btnPrimary, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Opt = { value: string; label: string };
type Analyte = { name: string; typeId: string };
export type ResultsFilter = { by: string; from: string; to: string; method: string; typeId: string; criterion: string; code: string; an: string };

const qs = (f: Partial<ResultsFilter>) => new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();

/** Bộ lọc trang Kết quả như XaLab: theo ngày quan trắc, ngày nhận mẫu, mã mẫu; xuất Excel; nhập kết quả từ file. */
export function ResultsSearch({ initial, methods, types, analytes, canImport }: { initial: ResultsFilter; methods: string[]; types: Opt[]; analytes: Analyte[]; canImport: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const same = (by: string) => (initial.by === by ? initial : { by, from: "", to: "", method: "", typeId: "", criterion: "", code: "", an: "" });
  const [qt, setQt] = useState(same("quan-trac"));
  const [nm, setNm] = useState(same("nhan-mau"));
  const [code, setCode] = useState(initial.by === "ma-mau" ? initial.code : "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const show = (f: Partial<ResultsFilter>) => start(() => router.push(`/results?${qs(f)}`));
  const exportUrl = (f: Partial<ResultsFilter>) => `/api/lab-results/export?${qs(f)}`;
  const label = "text-sm font-bold";
  const box = `${input} !w-full sm:!w-[165px]`;
  const sel = (value: string, onChange: (v: string) => void, opts: Opt[], empty: string, aria: string) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={aria} className={box}>
      <option value="">{empty}</option>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  const analyteOpts = (typeId: string) => analytes.filter((a) => !typeId || a.typeId === typeId).map((a) => ({ value: a.name, label: a.name }));
  const grid = "grid items-center gap-x-[30px] gap-y-3 sm:grid-cols-[165px_165px_70px_165px_auto]";

  async function upload() {
    if (!file) return toast.error("Chọn file kết quả (.csv)");
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/lab-results/import", { method: "POST", body: fd });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok && !b.saved) return toast.error("Không nhập được kết quả", (b.errors?.length ? b.errors : [b.error ?? `HTTP ${res.status}`]).slice(0, 3).join("; "));
    toast.success(`Đã lưu ${b.saved} kết quả từ file`, b.missing?.length ? `${b.missing.length} ô không khớp mã mẫu / chỉ tiêu: ${b.missing.slice(0, 3).join("; ")}` : undefined);
    if (b.errors?.length) toast.error(`${b.errors.length} ô sai định dạng`, b.errors.slice(0, 3).join("; "));
    setFile(null);
    start(() => router.refresh());
  }

  return (
    <div className="space-y-0 text-[#333]">
      <section className="space-y-3 pb-5">
        <div className={grid}>
          <span className={label}>Ngày quan trắc:</span>
          <input type="date" value={qt.from} onChange={(e) => setQt({ ...qt, from: e.target.value })} aria-label="Ngày quan trắc từ" className={box} />
          <span className={`${label} sm:text-right`}>đến:</span>
          <input type="date" value={qt.to} onChange={(e) => setQt({ ...qt, to: e.target.value })} aria-label="Ngày quan trắc đến" className={box} />
          <span />
        </div>
        <div className={grid}>
          <span className={label}>Phương pháp:</span>
          {sel(qt.method, (v) => setQt({ ...qt, method: v }), methods.map((m) => ({ value: m, label: m })), "-Chọn phương pháp-", "Phương pháp")}
          <label className="flex items-center gap-1.5 text-sm sm:col-span-3"><input type="checkbox" checked={qt.an === "1"} onChange={(e) => setQt({ ...qt, an: e.target.checked ? "1" : "" })} />Ẩn tiền tố và mã mẫu phụ ở Excel</label>
        </div>
        <div className={grid}>
          <span className={label}>Loại mẫu:</span>
          {sel(qt.typeId, (v) => setQt({ ...qt, typeId: v, criterion: "" }), types, "-Chọn loại mẫu-", "Loại mẫu (ngày quan trắc)")}
          <span className={`${label} sm:text-right`}>Chỉ tiêu:</span>
          {sel(qt.criterion, (v) => setQt({ ...qt, criterion: v }), analyteOpts(qt.typeId), "", "Chỉ tiêu (ngày quan trắc)")}
          <span className="flex gap-3">
            <button type="button" onClick={() => show({ ...qt, by: "quan-trac" })} className={btnPrimary}>Hiện kết quả</button>
            <a href={exportUrl({ ...qt, by: "quan-trac" })} className={btnPrimary}>Xuất Excel</a>
          </span>
        </div>
      </section>
      <hr className="border-[#eee]" />
      <section className="space-y-3 py-5">
        <div className={grid}>
          <span className={label}>Ngày nhận mẫu:</span>
          <input type="date" value={nm.from} onChange={(e) => setNm({ ...nm, from: e.target.value })} aria-label="Ngày nhận mẫu từ" className={box} />
          <span className={`${label} sm:text-right`}>đến:</span>
          <input type="date" value={nm.to} onChange={(e) => setNm({ ...nm, to: e.target.value })} aria-label="Ngày nhận mẫu đến" className={box} />
          <span />
        </div>
        <div className={grid}>
          <span className={label}>Loại mẫu:</span>
          {sel(nm.typeId, (v) => setNm({ ...nm, typeId: v, criterion: "" }), types, "-Chọn loại mẫu-", "Loại mẫu (ngày nhận mẫu)")}
          <span className={`${label} sm:text-right`}>Chỉ tiêu:</span>
          {sel(nm.criterion, (v) => setNm({ ...nm, criterion: v }), analyteOpts(nm.typeId), "", "Chỉ tiêu (ngày nhận mẫu)")}
          <span className="flex gap-3">
            <button type="button" onClick={() => show({ ...nm, by: "nhan-mau" })} className={btnPrimary}>Hiện kết quả</button>
            <a href={exportUrl({ ...nm, by: "nhan-mau" })} className={btnPrimary}>Xuất Excel</a>
          </span>
        </div>
      </section>
      <hr className="border-[#eee]" />
      <section className="py-5">
        <div className="grid items-center gap-x-[30px] gap-y-3 sm:grid-cols-[165px_165px_auto]">
          <span className={label}>Mã mẫu:</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} aria-label="Mã mẫu" className={box} />
          <span className="flex gap-3">
            <button type="button" onClick={() => code.trim() && show({ by: "ma-mau", code: code.trim() })} className={btnPrimary}>Hiện kết quả</button>
            <a href={exportUrl({ by: "ma-mau", code: code.trim() })} className={btnPrimary}>Xuất Excel</a>
          </span>
        </div>
      </section>
      {canImport && (
        <>
          <hr className="border-[#eee]" />
          <section className="py-5">
            <div className="grid items-center gap-x-[30px] gap-y-3 sm:grid-cols-[165px_263px_auto]">
              <span className={label}>Nhập kết quả từ file excel:</span>
              <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="File kết quả" className="text-sm" />
              <span><button type="button" disabled={busy} onClick={upload} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Lưu kết quả từ file excel</button></span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Dùng file tải về từ nút “Xuất Excel”, điền kết quả rồi lưu dạng CSV UTF-8. Chỉ ghi chỉ tiêu đang nhập hoặc bị trả lại; ô trống không xóa kết quả đã có.</p>
          </section>
        </>
      )}
    </div>
  );
}
