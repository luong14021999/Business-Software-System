"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { btn } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** Nút "Xóa số phiếu mới nhất" của một loại số phiếu. */
export function DeleteLatestNo({ kind }: { kind: string }) {
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  async function run() {
    if (!confirm(`Xóa số phiếu ${kind} mới nhất? Số trên đơn hàng tương ứng sẽ được bỏ.`)) return;
    setBusy(true);
    const res = await fetch(`/api/report-numbers?kind=${encodeURIComponent(kind)}`, { method: "DELETE" });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không xóa được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã xóa số phiếu ${b.deleted}`);
    start(() => router.refresh());
  }
  return <button type="button" disabled={busy} onClick={run} className={btn}>Xóa số phiếu mới nhất <X className="h-4 w-4 stroke-[3]" /></button>;
}
