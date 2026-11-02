"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { btn } from "@/components/m2/lab-ui/page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUSES = ["Đang lưu", "Đã phân tích QC", "Đã hủy"];

export function AddArchivedSampleDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setError(null);
    const payload = {
      archiveCode: String(formData.get("archiveCode") ?? "").trim(),
      originalSampleCode: String(
        formData.get("originalSampleCode") ?? "",
      ).trim(),
      customer: String(formData.get("customer") ?? "").trim(),
      type: String(formData.get("type") ?? "").trim(),
      archivedAt: String(formData.get("archivedAt") ?? ""),
      expiryAt: String(formData.get("expiryAt") ?? ""),
      location: String(formData.get("location") ?? "").trim(),
      storageCondition: String(formData.get("storageCondition") ?? "").trim(),
      amount: String(formData.get("amount") ?? "").trim(),
      status: String(formData.get("status") ?? "Đang lưu"),
      purpose: String(formData.get("purpose") ?? "").trim(),
    };
    const res = await fetch("/api/archived-samples", {
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
          Thêm mẫu lưu <Plus className="h-4 w-4 stroke-[3]" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Thêm mẫu lưu
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                AEMD-BM-13.05 · Ghi vào{" "}
                <code className="font-mono">data/archived-samples.json</code>
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
                <Label htmlFor="archiveCode">Mã mẫu lưu *</Label>
                <Input
                  id="archiveCode"
                  name="archiveCode"
                  required
                  placeholder="ML-VNNTH-2026-008"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Trạng thái</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="Đang lưu"
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="originalSampleCode">Mã mẫu gốc *</Label>
              <Input
                id="originalSampleCode"
                name="originalSampleCode"
                required
                placeholder="M-VNNTH-2026-00325"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer">Khách hàng</Label>
              <Input id="customer" name="customer" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Loại mẫu *</Label>
              <Input
                id="type"
                name="type"
                required
                placeholder="Đất / Nước / Rau ..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="archivedAt">Ngày lưu</Label>
                <Input
                  id="archivedAt"
                  name="archivedAt"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiryAt">Hạn lưu</Label>
                <Input id="expiryAt" name="expiryAt" type="date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="location">Vị trí lưu (tủ/ngăn)</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Tủ đông -20°C – Ngăn C2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Lượng còn</Label>
                <Input id="amount" name="amount" placeholder="≈ 200 g" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storageCondition">Điều kiện bảo quản</Label>
              <Input
                id="storageCondition"
                name="storageCondition"
                placeholder="Đông sâu -20°C, kín khí"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Mục đích lưu</Label>
              <Input
                id="purpose"
                name="purpose"
                placeholder="Phân tích đối chứng QC nội bộ 3 tháng"
              />
            </div>
            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2.5 py-2">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">
                  Hủy
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu mẫu lưu
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
