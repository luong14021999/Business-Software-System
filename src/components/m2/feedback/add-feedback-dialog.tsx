"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { btn } from "@/components/m2/lab-ui/page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ATTITUDE = ["Nhiệt tình", "Tốt", "Bình thường", "Kém"] as const;
const FEE = ["Cao", "Hợp lý", "Thấp"] as const;
const QUALITY = ["Tốt", "Khá", "Trung bình", "Kém"] as const;
const INFO = ["Tốt", "Khá", "Trung bình", "Kém"] as const;
const TIME = ["Nhanh", "Đúng hạn", "Bình thường", "Chậm"] as const;
const KINDS = [
  "Doanh nghiệp",
  "HTX / Trang trại",
  "Nông hộ",
  "Cơ quan nhà nước",
  "Viện / Trường",
];

export function AddFeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setError(null);
    const payload = {
      code: String(formData.get("code") ?? "").trim(),
      customerName: String(formData.get("customerName") ?? "").trim() || undefined,
      customerKind: String(formData.get("customerKind") ?? "").trim() || undefined,
      submittedAt:
        String(formData.get("submittedAt") ?? "") ||
        new Date().toISOString().slice(0, 10),
      serviceAttitude: String(formData.get("serviceAttitude") ?? "Tốt"),
      fee: String(formData.get("fee") ?? "Hợp lý"),
      quality: String(formData.get("quality") ?? "Tốt"),
      infoAvailability: String(formData.get("infoAvailability") ?? "Tốt"),
      deliveryTime: String(formData.get("deliveryTime") ?? "Đúng hạn"),
      comments: String(formData.get("comments") ?? "").trim() || undefined,
      isComplaint: formData.get("isComplaint") === "on",
      complaintStatus:
        formData.get("isComplaint") === "on" ? "Mới" : undefined,
    };
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? `HTTP ${res.status}`);
      return;
    }
    startTransition(() => {
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={btn}>
          Mở phiếu mới <Plus className="h-4 w-4 stroke-[3]" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-xl bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Ghi nhận ý kiến / khiếu nại KH
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                AEMD-BM-08.01 · Ghi vào{" "}
                <code className="font-mono">data/feedback.json</code>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <form action={onSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="code">Mã phiếu *</Label>
                <Input id="code" name="code" required placeholder="YK-VNNTH-2026-019" className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="submittedAt">Ngày góp ý</Label>
                <Input id="submittedAt" name="submittedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Tên KH (nếu cần thiết)</Label>
                <Input id="customerName" name="customerName" placeholder="Để trống = ẩn danh" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerKind">Phân loại</Label>
                <select id="customerKind" name="customerKind" defaultValue="" className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">— Chọn —</option>
                  {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "serviceAttitude", label: "Thái độ phục vụ", opts: ATTITUDE, def: "Tốt" },
                { key: "fee", label: "Phí dịch vụ", opts: FEE, def: "Hợp lý" },
                { key: "quality", label: "Chất lượng TN", opts: QUALITY, def: "Tốt" },
                { key: "infoAvailability", label: "Sẵn có thông tin", opts: INFO, def: "Tốt" },
                { key: "deliveryTime", label: "Hạn trả KQ", opts: TIME, def: "Đúng hạn" },
              ].map((r) => (
                <div key={r.key} className="space-y-1.5">
                  <Label htmlFor={r.key}>{r.label}</Label>
                  <select id={r.key} name={r.key} defaultValue={r.def} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                    {r.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comments">Ý kiến đóng góp khác</Label>
              <textarea id="comments" name="comments" className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm min-h-[64px]" />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" id="isComplaint" name="isComplaint" />
              Đánh dấu là khiếu nại (vào pipeline §7.9)
            </label>
            {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2.5 py-2">{error}</div>}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Dialog.Close asChild><Button variant="outline" type="button">Hủy</Button></Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu phiếu
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
