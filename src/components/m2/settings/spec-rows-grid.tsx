"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { XSaveBar } from "@/components/m2/lab-ui/x-save";
import { btn, btnPrimary, input, table } from "@/components/m2/lab-ui/page";
import { parseFactorFormula } from "@/lib/modules/m2/orders";
import type { SpecRow } from "@/lib/modules/m2/spec-rows";

type Cell = Omit<SpecRow, "minValue" | "maxValue"> & { minValue: string; maxValue: string };
type Source = { id: string; label: string; limits: { analyte: string; minValue: number | null; maxValue: number | null; notDetected: boolean; ndText: string }[] };

const show = (v: number | null) => (v == null ? "" : String(v).replace(".", ","));

/**
 * Lưới giới hạn của một cột quy chuẩn như XaLab: mỗi chỉ tiêu một dòng (tối thiểu, tối đa, không phát hiện, ghi chú, giá trị khi in).
 * "Tính toán": lấy giới hạn của cột quy chuẩn khác × công thức (VD *0,9*1,2) điền vào lưới, rồi bấm Lưu.
 */
export function SpecRowsGrid({ specId, rows, sources, canWrite }: { specId: string; rows: SpecRow[]; sources: Source[]; canWrite: boolean }) {
  const [cells, setCells] = useState<Cell[]>(rows.map((r) => ({ ...r, minValue: show(r.minValue), maxValue: show(r.maxValue) })));
  const [sourceId, setSourceId] = useState("");
  const [formula, setFormula] = useState("");
  const router = useRouter();
  // Lưới ghi đè cả cột bằng PUT (không phải thêm / sửa một bản ghi).
  const [putBusy, setPutBusy] = useState<string | null>(null);
  async function put(exit: boolean) {
    setPutBusy(exit ? "exit" : "save");
    const res = await fetch(`/api/specifications/${specId}/rows`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: cells }) });
    const b = await res.json().catch(() => ({}));
    setPutBusy(null);
    if (!res.ok) return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã lưu ${b.saved} chỉ tiêu có giới hạn`);
    if (exit) router.push("/specifications");
    else router.refresh();
  }
  function calc() {
    const src = sources.find((s) => s.id === sourceId);
    if (!src) return toast.error("Chọn cột quy chuẩn dùng để tính toán");
    const f = formula.trim() ? parseFactorFormula(formula) : (v: number) => v;
    if (!f) return toast.error('Công thức chỉ gồm các phép nhân / chia số, VD "*0,98*0,8"');
    const by = new Map(src.limits.map((l) => [l.analyte.toLowerCase(), l]));
    let n = 0;
    setCells((cs) =>
      cs.map((c) => {
        const l = by.get(c.analyte.toLowerCase());
        if (!l) return c;
        n++;
        if (l.notDetected) return { ...c, minValue: show(l.minValue), maxValue: show(l.maxValue), notDetected: true, ndText: l.ndText };
        return { ...c, minValue: l.minValue == null ? "" : show(f(l.minValue)), maxValue: l.maxValue == null || l.maxValue === 0 ? show(l.maxValue) : show(f(l.maxValue)), notDetected: false };
      }),
    );
    toast.success(`Đã tính ${n} chỉ tiêu`, "Kiểm tra lại rồi bấm Lưu");
  }
  const set = (i: number, patch: Partial<Cell>) => setCells((cs) => cs.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const small = `${input} h-[30px] px-2`;
  return (
    <div className="space-y-[15px]">
      {canWrite && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="src" className="text-sm font-bold">Cột quy chuẩn dùng để tính toán</label>
          <select id="src" value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={`${input} !w-72`}>
            <option value="" />
            {sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <label htmlFor="fx" className="text-sm font-bold">Công thức</label>
          <input id="fx" value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="vd: *0.98*0.8" className={`${input} !w-40`} />
          <button type="button" onClick={calc} className={btnPrimary}>Tính toán</button>
        </div>
      )}
      <fieldset disabled={!canWrite} className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr><th>#</th><th>Chỉ tiêu phân tích</th><th>Đơn vị</th><th>Giá trị tối thiểu</th><th>Giá trị tối đa</th><th>Không phát hiện</th><th>Ghi chú không phát hiện</th><th>Ghi chú khi in</th><th>Giá trị khi in</th></tr>
          </thead>
          <tbody>
            {cells.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">Loại mẫu của cột quy chuẩn chưa có chỉ tiêu nào</td></tr>}
            {cells.map((c, i) => (
              <tr key={c.analyte}>
                <td>{i + 1}</td>
                <td className="min-w-56">{c.analyte}</td>
                <td>{c.unit}</td>
                <td><input value={c.minValue} inputMode="decimal" onChange={(e) => set(i, { minValue: e.target.value })} aria-label={`Tối thiểu ${c.analyte}`} className={`${small} !w-24`} /></td>
                <td><input value={c.maxValue} inputMode="decimal" onChange={(e) => set(i, { maxValue: e.target.value })} aria-label={`Tối đa ${c.analyte}`} className={`${small} !w-24`} /></td>
                <td className="text-center"><input type="checkbox" checked={c.notDetected} onChange={(e) => set(i, { notDetected: e.target.checked })} aria-label={`Không phát hiện ${c.analyte}`} /></td>
                <td><input value={c.ndText} onChange={(e) => set(i, { ndText: e.target.value })} aria-label={`Ghi chú không phát hiện ${c.analyte}`} className={`${small} !w-24`} /></td>
                <td><input value={c.printNote} onChange={(e) => set(i, { printNote: e.target.value })} aria-label={`Ghi chú khi in ${c.analyte}`} className={`${small} !w-32`} /></td>
                <td><input value={c.printText} onChange={(e) => set(i, { printText: e.target.value })} aria-label={`Giá trị khi in ${c.analyte}`} className={`${small} !w-24`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </fieldset>
      <hr className="border-[#eee]" />
      <XSaveBar backHref="/specifications" canWrite={canWrite} busy={putBusy} save={(exit) => void put(exit)} />
      {canWrite && (
        <button
          type="button"
          className={btn}
          onClick={() => setCells((cs) => cs.map((c) => (c.notDetected || (!c.minValue && !c.maxValue) ? c : { ...c, printText: c.minValue && c.maxValue ? `${c.minValue} – ${c.maxValue}` : c.maxValue ? `≤ ${c.maxValue}` : `≥ ${c.minValue}` })))}
          title="Điền cột Giá trị khi in từ tối thiểu / tối đa để sửa tay khi cần"
        >
          Copy cài đặt tối thiểu/tối đa
        </button>
      )}
    </div>
  );
}
