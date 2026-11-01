"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

/** Nút chọn phương pháp mặc định (luôn in trên phiếu kết quả). */
export function SetDefaultMethod({ id, isDefault, canWrite }: { id: string; isDefault: boolean; canWrite: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  async function choose() {
    const res = await fetch(`/api/analyte-methods/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) });
    if (!res.ok) return toast.error("Không đặt được mặc định", (await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    start(() => router.refresh());
  }
  return (
    <label className="inline-flex items-center gap-1.5 text-sm">
      <input type="radio" checked={isDefault} disabled={!canWrite || pending} onChange={choose} />Mặc định
    </label>
  );
}
