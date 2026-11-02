"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btn, btnPrimary, link } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** Upload file kết quả (CSV theo file mẫu): dữ liệu hiện trường của đơn hàng (`orderId`) hoặc kết quả của mẻ (`batchId`). */
export function FieldImport({ orderId, batchId, templateUrl, backHref = "/orders", doneHref }: { orderId?: string; batchId?: string; templateUrl: string; backHref?: string; doneHref?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function upload() {
    if (!file) return toast.error("Chọn file dữ liệu hiện trường (.csv)");
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    if (orderId) fd.set("orderId", orderId);
    if (batchId) fd.set("batchId", batchId);
    const res = await fetch("/api/lab-results/import", { method: "POST", body: fd });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok && !b.saved) return toast.error("Không nhập được", (b.errors?.length ? b.errors : [b.error ?? `HTTP ${res.status}`]).slice(0, 3).join("; "));
    toast.success(`Đã lưu ${b.saved} kết quả`, b.missing?.length ? `${b.missing.length} ô không khớp mã mẫu / chỉ tiêu` : undefined);
    router.push(doneHref ?? `/orders/${orderId}/results`);
  }
  return (
    <div className="space-y-[15px]">
      <div className="grid items-center gap-1 sm:grid-cols-[165px_minmax(0,1fr)] sm:gap-x-[30px]">
        <span className="text-sm font-bold sm:text-right">File Excel</span>
        <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="File Excel" className="text-sm" />
      </div>
      <p className="text-xs text-muted-foreground sm:ml-[195px]">
        Dùng <a href={templateUrl} className={link}>{batchId ? "file mẫu của mẻ" : "file mẫu của đơn hàng"}</a> ({batchId ? "các mẫu × chỉ tiêu trong mẻ" : "các mẫu × chỉ tiêu hiện trường"}), điền kết quả rồi lưu dạng CSV UTF-8.
      </p>
      <div className="flex gap-1 sm:ml-[195px]">
        <Link href={backHref} className={btn}>Quay lại</Link>
        <button type="button" disabled={busy} onClick={upload} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Upload</button>
      </div>
    </div>
  );
}
