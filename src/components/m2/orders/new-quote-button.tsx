"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { btn } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** "Thêm" báo giá: tạo bản nháp (sau bóc tách lấy sẵn bảng kê) rồi mở trang sửa. */
export function NewQuoteButton({ orderId, kind, className = btn }: { orderId: string; kind: "after" | "before"; className?: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function create() {
    setBusy(true);
    const res = await fetch("/api/order-quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, kind, draft: true }) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không tạo được báo giá", b.error ?? `HTTP ${res.status}`);
    router.push(`/orders/${orderId}/quote/${b.item.id}`);
  }
  return (
    <button type="button" disabled={busy} onClick={create} className={className}>
      Thêm {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 stroke-[3]" />}
    </button>
  );
}
