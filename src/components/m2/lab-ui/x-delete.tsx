"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { link } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** Link "Xóa ✖" trong bảng danh sách kiểu XaLab (hỏi lại trước khi xóa). */
export function XDeleteLink({ url, label }: { url: string; label: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  async function remove() {
    if (!confirm(`Xóa "${label}"?`)) return;
    const res = await fetch(url, { method: "DELETE" });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không xóa được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã xóa "${label}"`);
    start(() => router.refresh());
  }
  return (
    <button type="button" disabled={pending} onClick={remove} className={`${link} inline-flex items-center gap-0.5`}>
      Xóa <X className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
    </button>
  );
}
