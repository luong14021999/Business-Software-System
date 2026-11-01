"use client";

import Image from "next/image";
import Link from "next/link";
import { Database, Settings } from "lucide-react";
import { HeaderUser } from "@/components/layout/header-user";
import { cn } from "@/lib/utils";

/** Phần mềm nghiệp vụ dùng thanh menu riêng thay cho thanh tiêu đề chung của nền tảng. */
export const OWN_CHROME = ["M2", "M3.1", "M3.2"];

/** Logo Viện thu nhỏ – bấm để về trang chủ các phần mềm. */
export function ModuleHomeLink({ tone, className }: { tone: "dark" | "light"; className?: string }) {
  return (
    <Link href="/" title="Về trang chủ – các phần mềm" aria-label="Về trang chủ – các phần mềm" className={cn("flex shrink-0 items-center", className)}>
      <span className={cn("flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white ring-2", tone === "dark" ? "ring-white/30" : "ring-[hsl(var(--gov-gold))]")}>
        <Image src="/logo-vnnth.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
      </span>
    </Link>
  );
}

/** Nút Quản trị / Danh mục (theo quyền) và Đăng xuất ở cuối thanh menu của phần mềm. */
/** `iconOnly`: chỉ hiện biểu tượng cho Quản trị / Danh mục dùng chung (khi phần mềm đã có nút "Danh mục" riêng). */
export function ModuleActions({ tone, canAdmin, canCatalog, iconOnly = false }: { tone: "dark" | "light"; canAdmin: boolean; canCatalog: boolean; iconOnly?: boolean }) {
  const cls = cn(
    "flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm font-medium transition-colors",
    tone === "dark" ? "border-white/20 text-[#ccc] hover:bg-white/10 hover:text-white" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
  );
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {canAdmin ? (
        <Link href="/admin" title="Quản trị hệ thống" aria-label="Quản trị hệ thống" className={cls}>
          <Settings className="h-4 w-4" />
          {!iconOnly && <span className="hidden xl:inline">Quản trị</span>}
        </Link>
      ) : canCatalog ? (
        <Link href="/master-data" title="Danh mục dùng chung" aria-label="Danh mục dùng chung" className={cls}>
          <Database className="h-4 w-4" />
          {!iconOnly && <span className="hidden xl:inline">Danh mục</span>}
        </Link>
      ) : null}
      <HeaderUser className={cls} />
    </div>
  );
}
