import type { ReactNode } from "react";
import Link from "next/link";

/** Thanh tab kiểu Bootstrap của XaLab (VD Hiệu chuẩn/Tồn kho | Xuất kho | Nhập kho). */
export function XTabs({ tabs, active }: { tabs: { label: string; href: string }[]; active: string }) {
  return (
    <ul className="mb-[10px] flex flex-wrap border-b border-[#ddd] text-sm">
      {tabs.map((t) => (
        <li key={t.href} className="-mb-px">
          {t.href === active ? (
            <span className="block rounded-t border border-[#ddd] border-b-transparent bg-[linear-gradient(#f5fafd,#e8f3fa)] px-[15px] py-[10px] text-[#333]">{t.label}</span>
          ) : (
            <Link href={t.href} className="block rounded-t border border-transparent px-[15px] py-[10px] text-[#337ab7] hover:border-[#eee] hover:bg-[#eee]">{t.label}</Link>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Hộp thông báo / cảnh báo kiểu alert của Bootstrap với các link lọc nhanh. */
export function XAlert({ tone, title, links }: { tone: "info" | "danger"; title: string; links: { label: string; href: string; icon: ReactNode; active?: boolean }[] }) {
  const c = tone === "info" ? "border-[#bce8f1] bg-[#d9edf7] text-[#31708f]" : "border-[#ebccd1] bg-[#f2dede] text-[#a94442]";
  return (
    <div className={`mb-5 rounded border px-[15px] pb-3 pt-[15px] ${c}`}>
      <h4 className="mb-3 text-lg">{title}</h4>
      <ul className="space-y-3 text-sm font-bold">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={`inline-flex items-center gap-1 hover:underline ${l.active ? "underline" : ""}`}>{l.icon}{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
