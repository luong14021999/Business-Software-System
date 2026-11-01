"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btnXs } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** Tạo mẻ thử nghiệm mới theo mẫu mẻ rồi mở trang mẻ để chọn mã mẫu. */
export function CreateBatchButton({ templateId }: { templateId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function create() {
    setBusy(true);
    const res = await fetch(`/api/batch-templates/${templateId}/create-batch`, { method: "POST" });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không tạo được mẻ", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã tạo mẻ ${b.item.code}`);
    router.push(`/test-batches/${b.item.id}`);
  }
  return (
    <button type="button" onClick={create} disabled={busy} className={btnXs}>
      {busy && <Loader2 className="h-3 w-3 animate-spin" />}Tạo mẻ
    </button>
  );
}
