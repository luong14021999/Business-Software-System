"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btn, btnPrimary, link } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** Upload file dữ liệu hiện trường của đơn hàng (CSV theo file mẫu). */
export function FieldImport({ orderId, templateUrl }: { orderId: string; templateUrl: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function upload() {
    if (!file) return toast.error("Chọn file dữ liệu hiện trường (.csv)");
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("orderId", orderId);
    const res = await fetch("/api/lab-results/import", { method: "POST", body: fd });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok && !b.saved) return toast.error("Không nhập được", (b.errors?.length ? b.errors : [b.error ?? `HTTP ${res.status}`]).slice(0, 3).join("; "));
    toast.success(`Đã lưu ${b.saved} kết quả hiện trường`, b.missing?.length ? `${b.missing.length} ô không khớp mã mẫu / chỉ tiêu hiện trường` : undefined);
    router.push(`/orders/${orderId}/results`);
  }
  return (
    <div className="space-y-[15px]">
      <div className="grid items-center gap-1 sm:grid-cols-[165px_minmax(0,1fr)] sm:gap-x-[30px]">
        <span className="text-sm font-bold sm:text-right">File Excel</span>
        <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="File Excel" className="text-sm" />
      </div>
      <p className="text-xs text-muted-foreground sm:ml-[195px]">
        Dùng <a href={templateUrl} className={link}>file mẫu của đơn hàng</a> (các mẫu × chỉ tiêu hiện trường), điền kết quả rồi lưu dạng CSV UTF-8.
      </p>
      <div className="flex gap-1 sm:ml-[195px]">
        <Link href="/orders" className={btn}>Quay lại</Link>
        <button type="button" disabled={busy} onClick={upload} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Upload</button>
      </div>
    </div>
  );
}
