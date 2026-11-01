"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Phần mềm nghiệp vụ dùng thanh menu riêng thay cho thanh tiêu đề chung của nền tảng. */
export const OWN_CHROME = ["M2", "M3.1", "M3.2"];

/**
 * Nút "←" về trang chủ các phần mềm, kèm logo Viện đứng riêng bên cạnh.
 * Danh mục dùng chung và Đăng xuất nằm ở thanh tiêu đề của trang chủ.
 */
export function ModuleBackButton({ tone, className }: { tone: "dark" | "light"; className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <Link
        href="/"
        title="Về trang chủ – các phần mềm"
        aria-label="Về trang chủ – các phần mềm"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
          tone === "dark" ? "border-white/20 text-[#ccc] hover:bg-white/10 hover:text-white" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </Link>
      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white">
        <Image src="/logo-vnnth.png" alt="Viện Nông nghiệp Thanh Hóa" width={36} height={36} className="h-9 w-9 object-contain" />
      </span>
    </div>
  );
}
