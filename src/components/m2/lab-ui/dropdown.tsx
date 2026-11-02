"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropItem = { label: string; href?: string; onClick?: () => void; danger?: boolean; divider?: boolean; active?: boolean };

/** Nút mở danh sách lựa chọn (bộ lọc, "Chức năng", "In ấn"…); `filter` = nút lọc, dùng biểu tượng phễu như XaLab. */
export function Dropdown({ label, items, className, align = "left", icon, filter = false }: { label: ReactNode; items: DropItem[]; className?: string; align?: "left" | "right"; icon?: ReactNode; filter?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className={className}>
        {label}
        {icon ?? (filter ? <Filter className="h-3.5 w-3.5 fill-current" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />)}
      </button>
      {open && (
        <ul role="menu" className={cn("absolute top-full z-40 mt-0.5 min-w-[12rem] rounded border border-black/15 bg-white py-1.5 text-sm text-[#333] shadow-[0_6px_12px_rgba(0,0,0,0.175)]", align === "right" ? "right-0" : "left-0")}>
          {items.map((it, i) =>
            it.divider ? (
              <li key={i} role="separator" className="my-1.5 border-t border-[#e5e5e5]" />
            ) : (
              <li key={i} role="none">
                {it.href ? (
                  <Link role="menuitem" href={it.href} onClick={() => setOpen(false)} className={cn("block whitespace-nowrap px-5 py-[5px] hover:bg-[#f5f5f5]", it.danger && "text-[#a94442]", it.active && "bg-[#f5f5f5] font-medium")}>
                    {it.label}
                  </Link>
                ) : (
                  <button role="menuitem" type="button" onClick={() => { setOpen(false); it.onClick?.(); }} className={cn("block w-full whitespace-nowrap px-5 py-[5px] text-left hover:bg-[#f5f5f5]", it.danger && "text-[#a94442]")}>
                    {it.label}
                  </button>
                )}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
