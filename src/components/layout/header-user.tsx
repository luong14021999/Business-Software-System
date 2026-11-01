"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { signOutAll } from "@/components/platform/sign-out-link";

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

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      aria-label="Đăng xuất"
      className="flex items-center gap-2 h-10 px-3.5 rounded-lg text-sm font-medium text-white/90 border border-white/25 bg-white/10 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">Đăng xuất</span>
    </button>
  );
}
