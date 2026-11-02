"use client";

import { useRef, useState } from "react";
import { input } from "@/components/m2/lab-ui/page";

/** Ký tự hay dùng khi gõ tên / đơn vị chỉ tiêu (như nút Ω của XaLab). */
export const SYMBOLS = ["²", "³", "₂", "₃", "₄", "°", "µ", "α", "β", "γ", "Φ", "φ", "Ø", "ω", "Ω", "±", "≤", "≥", "‰"];

/** Ô nhập kèm nút Ω: bấm để chèn ký tự đặc biệt vào vị trí con trỏ. */
export function SymbolInput({ value, onChange, disabled, label }: { value: string; onChange: (v: string) => void; disabled?: boolean; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  function insert(ch: string) {
    const el = ref.current;
    const at = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? at;
    onChange(value.slice(0, at) + ch + value.slice(end));
    setOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + ch.length, at + ch.length);
    });
  }
  return (
    <div className="relative flex">
      <input ref={ref} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-label={label} className={`${input} rounded-r-none`} />
      <button type="button" disabled={disabled} onClick={() => setOpen((x) => !x)} aria-label={`Chèn ký tự đặc biệt vào ${label.toLowerCase()}`} className="-ml-px h-[34px] rounded-r border border-[#ccc] bg-white px-3 text-sm hover:bg-[#e6e6e6]">Ω</button>
      {open && (
        <div className="absolute right-0 top-[36px] z-20 grid w-56 grid-cols-6 gap-1 rounded border border-[#ccc] bg-white p-2 shadow-md">
          {SYMBOLS.map((s) => (
            <button key={s} type="button" onClick={() => insert(s)} className="h-8 rounded border border-[#ddd] text-sm hover:bg-[#e6e6e6]">{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
