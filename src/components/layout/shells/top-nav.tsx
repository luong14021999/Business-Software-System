"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { isActiveHref, moduleOf, useVisibleGroups } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";
import { ModuleBackButton } from "@/components/layout/module-chrome";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { signOutAll } from "@/components/platform/sign-out-link";

/**
 * Khung "menu ngang" (phòng thí nghiệm, theo XaLab): thanh tối, nội dung trong khung 1170px, mỗi nhóm là một mục
 * hoặc menu xổ xuống, "Tài khoản ▾" ở bên phải. Đầu thanh: nút về trang chủ các phần mềm và logo Viện.
 * Trên điện thoại các mục menu nằm trong ngăn kéo ☰.
 */
export function TopNav() {
  const pathname = usePathname();
  const mod = moduleOf(pathname);
  const groups = useVisibleGroups(mod?.groups ?? []);
  // Menu đang mở gắn với trang mở nó → tự đóng khi chuyển trang.
  const [openAt, setOpenAt] = useState<{ label: string; path: string } | null>(null);
  const open = openAt?.path === pathname ? openAt.label : null;
  const setOpen = (label: string | null) => setOpenAt(label ? { label, path: pathname } : null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  async function logout() {
    await signOutAll();
    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpenAt(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!mod) return null;
  const item = "flex h-[50px] items-center gap-1 px-[15px] text-[14px] transition-colors";
  const menu = (label: string, active: boolean, children: React.ReactNode, right = false) => {
    const isOpen = open === label;
    return (
      <li key={label} className="relative">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={() => setOpen(isOpen ? null : label)}
          className={cn(item, active || isOpen ? "bg-[#080808] text-white" : "text-[#9d9d9d] hover:text-white")}
        >
          {label}
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
        {isOpen && (
          <ul role="menu" className={cn("absolute top-full z-50 max-h-[80vh] min-w-[10rem] overflow-y-auto rounded-b border border-black/15 bg-white py-1.5 text-sm text-[#333] shadow-[0_6px_12px_rgba(0,0,0,0.175)]", right ? "right-0" : "left-0")}>
            {children}
          </ul>
        )}
      </li>
    );
  };
  const menuLink = (href: string, label: string) => (
    <li key={href} role="none">
      <Link role="menuitem" href={href} className={cn("block whitespace-nowrap px-5 py-[5px] hover:bg-[#f5f5f5]", isActiveHref(href, pathname) && "bg-[#f5f5f5] font-medium")}>
        {label}
      </Link>
    </li>
  );
  return (
    <nav ref={ref} aria-label={`Menu ${mod.name}`} className="shrink-0 bg-[#222]">
      <div className="mx-auto flex max-w-[1170px] items-center gap-2 px-2 md:gap-0 lg:px-[15px]">
        <div className="md:hidden"><MobileSidebar /></div>
        <ModuleBackButton tone="dark" className="my-1.5 md:mr-1" />
        <span className="truncate text-sm font-medium text-white md:hidden">{mod.name}</span>
        <ul className="hidden min-w-0 flex-1 flex-wrap items-stretch md:flex">
          {groups.map((g) => {
            const active = g.items.some((i) => isActiveHref(i.href, pathname));
            if (g.link || g.items.length === 1) {
              return (
                <li key={g.label}>
                  <Link href={g.items[0].href} aria-current={active ? "page" : undefined} className={cn(item, active ? "bg-[#080808] text-white" : "text-[#9d9d9d] hover:text-white")}>
                    {g.label}
                  </Link>
                </li>
              );
            }
            return menu(g.label, active, g.items.map((i) => menuLink(i.href, i.label)));
          })}
        </ul>
        <ul className="hidden items-stretch md:flex">
          {menu(
            "Tài khoản",
            isActiveHref("/lab-account", pathname),
            <>
              {menuLink("/lab-account", "Thông tin tài khoản")}
              <li role="none">
                <button type="button" role="menuitem" onClick={logout} className="block w-full whitespace-nowrap px-5 py-[5px] text-left hover:bg-[#f5f5f5]">Đăng xuất</button>
              </li>
            </>,
            true,
          )}
        </ul>
      </div>
    </nav>
  );
}
