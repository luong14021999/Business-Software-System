"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Phần mềm nghiệp vụ dùng thanh menu riêng thay cho thanh tiêu đề chung của nền tảng. */
export const OWN_CHROME = ["M2", "M3.1", "M3.2"];

/**
 * Nút quay về trang chủ các phần mềm (mũi tên + logo Viện) ở đầu thanh menu của phần mềm.
 * Danh mục dùng chung và Đăng xuất nằm ở thanh tiêu đề của trang chủ.
 */
export function ModuleBackButton({ tone, className }: { tone: "dark" | "light"; className?: string }) {
  return (
    <Link
      href="/"
      title="Về trang chủ – các phần mềm"
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-md border pl-2 pr-1 text-sm font-medium transition-colors",
        tone === "dark" ? "border-white/20 text-[#ccc] hover:bg-white/10 hover:text-white" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Các phần mềm</span>
      <span className="sr-only sm:hidden">Về trang chủ – các phần mềm</span>
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white">
        <Image src="/logo-vnnth.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
      </span>
    </Link>
  );
}
