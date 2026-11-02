"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Hộp thoại kiểu Bootstrap của XaLab: nền mờ, khung 600px, tiêu đề + ×, thân, chân nút căn phải. */
export function XModal({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-3 py-[30px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="mx-auto w-full max-w-[600px] rounded-md border border-black/20 bg-white text-[#333] shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] p-[15px]">
          <h4 className="text-lg">{title}</h4>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-[21px] font-bold leading-none text-black opacity-20 hover:opacity-50">×</button>
        </div>
        <div className="p-[15px]">{children}</div>
        <div className="flex justify-end gap-1 border-t border-[#e5e5e5] p-[15px]">{footer}</div>
      </div>
    </div>,
    document.body,
  );
}
