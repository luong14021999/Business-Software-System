"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { UserPlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerKind } from "@/lib/mock-data";

const KINDS: CustomerKind[] = [
  "Doanh nghiệp",
  "HTX / Trang trại",
  "Nông hộ",
  "Cơ quan nhà nước",
  "Viện / Trường",
];

export function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setError(null);
    const payload = {
      code: String(formData.get("code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      kind: String(formData.get("kind") ?? "") as CustomerKind,
      contact: String(formData.get("contact") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      samplesYTD: Number(formData.get("samplesYTD") ?? 0) || 0,
      lastSampleAt: String(formData.get("lastSampleAt") ?? "").trim(),
    };
    if (!payload.code || !payload.name || !payload.kind) {
      setError("Mã, tên và phân loại là bắt buộc");
      return;
    }
    const res = await fetch("/api/customers", {
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
        <Button size="sm">
          <UserPlus />
          Thêm khách hàng
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Thêm khách hàng mới
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Lưu vào{" "}
                <code className="font-mono">data/customers.json</code>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Đóng"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form
            action={onSubmit}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="code">Mã KH *</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  placeholder="KH-VNNTH-0999"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kind">Phân loại *</Label>
                <select
                  id="kind"
                  name="kind"
                  required
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Chọn nhóm…
                  </option>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Tên khách hàng *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="HTX Nông nghiệp …"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact">Đầu mối liên hệ</Label>
                <Input id="contact" name="contact" placeholder="Họ tên" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Điện thoại</Label>
                <Input id="phone" name="phone" placeholder="09xx xxx xxx" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input id="address" name="address" placeholder="Xã/Huyện/Tỉnh" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="samplesYTD">Mẫu YTD</Label>
                <Input
                  id="samplesYTD"
                  name="samplesYTD"
                  type="number"
                  defaultValue={0}
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastSampleAt">Mẫu gần nhất</Label>
                <Input
                  id="lastSampleAt"
                  name="lastSampleAt"
                  type="date"
                />
              </div>
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
                Lưu khách hàng
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
