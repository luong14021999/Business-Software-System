"use client";

import { useState } from "react";
import { XSaveBar, useXSave } from "@/components/m2/lab-ui/x-save";
import { input } from "@/components/m2/lab-ui/page";

type Opt = { value: string; label: string };
type Analyte = Opt & { sampleTypeId: string };
export type MappingValue = { sampleTypeId: string; mainAnalyteId: string; method: string; accessoryIds: string[]; hideAccessory: boolean };

const EXTRA = 20;

/** Form chỉ tiêu phụ như XaLab: loại mẫu → chỉ tiêu chính, phương pháp, chỉ tiêu phụ + "Chỉ tiêu phụ thêm 1–20", Ẩn chỉ tiêu phụ. */
export function MappingForm({ id, initial, types, analytes, methods, canWrite }: { id?: string; initial: MappingValue; types: Opt[]; analytes: Analyte[]; methods: string[]; canWrite: boolean }) {
  const [v, setV] = useState(initial);
  const slots = Array.from({ length: EXTRA + 1 }, (_, i) => v.accessoryIds[i] ?? "");
  const mine = analytes.filter((a) => !v.sampleTypeId || a.sampleTypeId === v.sampleTypeId);
  const { busy, save } = useXSave({
    endpoint: "/api/analyte-mappings",
    id,
    backHref: "/analyte-mappings",
    editBase: "/analyte-mappings",
    payload: () => {
      const accessoryIds = [...new Set(slots.filter(Boolean))];
      if (!v.mainAnalyteId) return "Chọn chỉ tiêu chính";
      if (!accessoryIds.length) return "Chọn ít nhất một chỉ tiêu phụ";
      if (accessoryIds.includes(v.mainAnalyteId)) return "Chỉ tiêu phụ không được trùng chỉ tiêu chính";
      return { ...v, accessoryIds };
    },
  });
  const setSlot = (i: number, val: string) => setV((x) => {
    const next = Array.from({ length: EXTRA + 1 }, (_, k) => x.accessoryIds[k] ?? "");
    next[i] = val;
    return { ...x, accessoryIds: next };
  });
  const row = "grid items-center gap-1 sm:grid-cols-[165px_360px] sm:gap-x-[30px]";
  const label = "text-sm font-bold text-[#333] sm:text-right";
  const pick = (value: string, onChange: (x: string) => void, opts: Opt[], aria: string, empty = "") => (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={aria} className={input}>
      <option value="">{empty}</option>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  return (
    <div className="space-y-[15px]">
      <fieldset disabled={!canWrite} className="space-y-[15px]">
        <div className={row}><span className={label}>Loại mẫu</span>{pick(v.sampleTypeId, (x) => setV({ ...v, sampleTypeId: x, mainAnalyteId: "", accessoryIds: [] }), types, "Loại mẫu", "-chọn loại mẫu-")}</div>
        <div className={row}><span className={label}>Chỉ tiêu chính</span>{pick(v.mainAnalyteId, (x) => setV({ ...v, mainAnalyteId: x }), mine, "Chỉ tiêu chính")}</div>
        <div className={row}><span className={label}>Phương pháp phân tích</span>{pick(v.method, (x) => setV({ ...v, method: x }), methods.map((m) => ({ value: m, label: m })), "Phương pháp phân tích", "Mọi phương pháp")}</div>
        <div className={row}><span className={label}>Chỉ tiêu phụ</span>{pick(slots[0], (x) => setSlot(0, x), mine, "Chỉ tiêu phụ")}</div>
        {slots.slice(1).map((s, i) => (
          <div key={i} className={row}><span className={label}>Chỉ tiêu phụ thêm {i + 1}:</span>{pick(s, (x) => setSlot(i + 1, x), mine, `Chỉ tiêu phụ thêm ${i + 1}`)}</div>
        ))}
        <label className={row}><span className={label}>Ẩn chỉ tiêu phụ</span><span><input type="checkbox" checked={v.hideAccessory} onChange={(e) => setV({ ...v, hideAccessory: e.target.checked })} className="h-4 w-4" /></span></label>
      </fieldset>
      <hr className="border-[#eee]" />
      <XSaveBar backHref="/analyte-mappings" canWrite={canWrite} busy={busy} save={save} />
    </div>
  );
}
