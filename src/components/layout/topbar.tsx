"use client";

import Link from "next/link";
import { Database, Settings } from "lucide-react";
import { HeaderUser } from "@/components/layout/header-user";
import { DongSonDrum } from "@/components/brand/dong-son-drum";
import { GovGoldRule, GovIdentity } from "@/components/brand/gov-identity";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { usePathname } from "next/navigation";
import { moduleOf, shellOf } from "@/components/layout/nav-config";
import { OWN_CHROME } from "@/components/layout/module-chrome";

/**
 * Thanh trên cùng dùng chung, phong cách cơ quan nhà nước: nền xanh lá đậm, họa tiết trống đồng Đông Sơn,
 * dòng cơ quan chủ quản + tên Viện; phần mềm đang mở hiện thành nhãn theo màu riêng.
 * Nút Quản trị / Danh mục chỉ hiện với người có quyền.
 */
export function TopBar({ canAdmin = false, canCatalog = false }: { canAdmin?: boolean; canCatalog?: boolean }) {
  const pathname = usePathname();
  const mod = moduleOf(pathname);
  // Trong phần mềm nghiệp vụ, thanh menu của phần mềm có nút về trang chủ; Danh mục / Đăng xuất ở trang chủ.
  if (mod && OWN_CHROME.includes(mod.code)) return null;
  // Menu dọc và menu ngang dùng chung ngăn kéo ☰ trên điện thoại.
  const hasSidebar = shellOf(mod) === "sidebar" || shellOf(mod) === "topnav";
  const ModIcon = mod?.icon;
  return (
    <header className="relative shrink-0 text-white shadow-md">
      <div className="gov-banner relative flex h-16 items-center gap-2 overflow-hidden pl-2 pr-2 sm:h-20 sm:gap-3 sm:pr-5 lg:gap-4 lg:pl-5 lg:pr-7">
        {/* Họa tiết mặt trống đồng – vàng đồng, mờ */}
        <DongSonDrum className="pointer-events-none absolute -right-10 top-1/2 h-56 w-56 -translate-y-1/2 text-[hsl(var(--gov-gold-light))] opacity-[0.16] sm:h-72 sm:w-72" />
        <DongSonDrum className="pointer-events-none absolute left-[38%] top-1/2 hidden h-40 w-40 -translate-y-1/2 text-[hsl(var(--gov-gold-light))] opacity-[0.06] lg:block" />

        {hasSidebar && (
          <div className="relative z-10 md:hidden">
            <MobileSidebar />
          </div>
        )}

        <Link href="/" className="relative z-10 min-w-0" aria-label="Trang chủ nền tảng số">
          <GovIdentity subtitle={<span className="hidden sm:inline">Nền tảng số – một tài khoản cho tất cả phần mềm</span>} />
        </Link>

        {mod && ModIcon && (
          <span className="relative z-10 ml-1 hidden min-w-0 items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-primary shadow-sm ring-1 ring-[hsl(var(--gov-gold))] md:flex">
            <ModIcon className="h-5 w-5 shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block font-mono text-[10px] font-bold opacity-70">{mod.code}</span>
              <span className="block max-w-[16rem] truncate text-sm font-semibold">{mod.name}</span>
            </span>
          </span>
        )}

      <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2">
        {canAdmin ? (
          <Link
            href="/admin"
            aria-label="Quản trị hệ thống"
            title="Quản trị hệ thống"
            className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${mod?.key === "m1" ? "border-white bg-white/25 text-white" : "border-white/25 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"}`}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden lg:inline">Quản trị</span>
          </Link>
        ) : canCatalog ? (
          <Link href="/master-data" title="Danh mục dùng chung" aria-label="Danh mục dùng chung" className="flex h-10 items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 text-sm font-medium text-white/90 hover:bg-white/20 hover:text-white">
            <Database className="h-4 w-4" />
            <span className="hidden lg:inline">Danh mục</span>
          </Link>
        ) : null}
        <HeaderUser />
      </div>
      </div>
      <GovGoldRule />
    </header>
  );
}
