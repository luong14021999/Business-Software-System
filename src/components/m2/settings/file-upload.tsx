"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btnPrimary } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

/** "File Excel [chọn file] [Upload]": gửi file lên `url`, xong thì mở `doneHref`; lỗi từng dòng hiện bên dưới. */
export function FileUpload({ url, doneHref }: { url: string; doneHref: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();
  async function upload() {
    if (!file) return toast.error("Chọn file");
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch(url, { method: "POST", body: fd });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không nhập được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã nhập ${b.saved} dòng`);
    if (b.errors?.length) return setErrors(b.errors);
    router.push(doneHref);
  }
  return (
    <div className="space-y-3">
      <label className="grid items-center gap-1 sm:grid-cols-[165px_1fr] sm:gap-x-[30px]">
        <span className="text-sm font-bold sm:text-right">File Excel</span>
        <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <div className="sm:pl-[195px]"><button type="button" disabled={busy} onClick={upload} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Upload</button></div>
      {errors.length > 0 && <ul className="list-disc rounded border border-[#ebccd1] bg-[#f2dede] p-3 pl-8 text-sm text-[#a94442]">{errors.slice(0, 50).map((e) => <li key={e}>{e}</li>)}</ul>}
    </div>
  );
}
