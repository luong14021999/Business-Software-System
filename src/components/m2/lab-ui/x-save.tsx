"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { btn, btnPrimary } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/**
 * Lưu một form tự dựng (có bảng dòng con…) theo kiểu XaLab: [←] [Lưu & thoát] [Lưu].
 * `payload()` trả dữ liệu gửi đi hoặc chuỗi lỗi; tạo mới xong "Lưu" chuyển sang `${editBase}/${id}`.
 */
export function useXSave({ endpoint, id, backHref, editBase, payload }: { endpoint: string; id?: string; backHref: string; editBase?: string; payload: () => Record<string, unknown> | string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  async function save(exit: boolean) {
    const body = payload();
    if (typeof body === "string") return toast.error(body);
    setBusy(exit ? "exit" : "save");
    const res = await fetch(id ? `${endpoint}/${id}` : endpoint, { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu");
    if (exit) return start(() => router.push(backHref));
    if (!id && b.item?.id && editBase) return start(() => router.replace(`${editBase}/${b.item.id}`));
    start(() => router.refresh());
  }
  return { busy, save };
}

export function XSaveBar({ backHref, canWrite, busy, save }: { backHref: string; canWrite: boolean; busy: string | null; save: (exit: boolean) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Link href={backHref} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
      {canWrite && (
        <>
          <button type="button" disabled={Boolean(busy)} onClick={() => save(true)} className={btnPrimary}>{busy === "exit" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
          <button type="button" disabled={Boolean(busy)} onClick={() => save(false)} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
        </>
      )}
    </div>
  );
}
