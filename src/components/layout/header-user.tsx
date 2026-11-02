"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, UserRound } from "lucide-react";
import { signOutAll } from "@/components/platform/sign-out-link";

/** Nút Tài khoản và Đăng xuất ở thanh trên cùng của trang chủ các phần mềm. */
export function HeaderUser() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [signingOut, setSigningOut] = useState(false);

  async function onLogout() {
    setSigningOut(true);
    await signOutAll();
    setSigningOut(false);
    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  const loading = signingOut || pending;

  const cls = "flex items-center gap-2 h-10 px-3.5 rounded-lg text-sm font-medium text-white/90 border border-white/25 bg-white/10 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-60";
  return (
    <>
    <Link href="/account" aria-label="Tài khoản" title="Thông tin tài khoản" className={cls}>
      <UserRound className="w-4 h-4" />
      <span className="hidden sm:inline">Tài khoản</span>
    </Link>
    <button
      onClick={onLogout}
      disabled={loading}
      aria-label="Đăng xuất"
      className={cls}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">Đăng xuất</span>
    </button>
    </>
  );
}
