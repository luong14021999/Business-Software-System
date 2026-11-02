"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { link } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** Link "Copy" cuối dòng: gọi API copy rồi mở bản ghi mới. */
export function CopyLink({ url, openBase, label }: { url: string; openBase: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function copy() {
    if (!confirm(`Copy ${label}?`)) return;
    setBusy(true);
    const res = await fetch(url, { method: "POST" });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không copy được", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã copy");
    router.push(`${openBase}/${b.item.id}`);
  }
  return <button type="button" disabled={busy} onClick={copy} className={`${link} inline-flex items-center gap-1`}>Copy<Copy className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden /></button>;
}
