"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { btn } from "@/components/m2/lab-ui/page";

const CATEGORIES = [
  "Dụng cụ thể tích",
  "Dụng cụ thủy tinh",
  "Dụng cụ cầm tay",
  "Vật tư tiêu hao",
  "Thiết bị nhỏ",
];

const STATUSES = ["Sẵn sàng", "Đang dùng", "Hỏng", "Chờ kiểm định"];

export function AddToolDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [calibRequired, setCalibRequired] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setError(null);
    const payload = {
      code: String(formData.get("code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      category: String(formData.get("category") ?? "Dụng cụ cầm tay"),
      spec: String(formData.get("spec") ?? "").trim(),
      qty: Number(formData.get("qty") ?? 0),
      unit: String(formData.get("unit") ?? "cái"),
      minQty: Number(formData.get("minQty") ?? 0),
      location: String(formData.get("location") ?? "").trim(),
      calibrationRequired: formData.get("calibrationRequired") === "on",
      lastCalibration: String(formData.get("lastCalibration") ?? "") || undefined,
      nextCalibration: String(formData.get("nextCalibration") ?? "") || undefined,
      status: String(formData.get("status") ?? "Sẵn sàng"),
    };
    const res = await fetch("/api/tools", {
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
          Thêm dụng cụ <Plus className="h-4 w-4 stroke-[3]" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Thêm dụng cụ mới
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Ghi vào <code className="font-mono">data/tools.json</code> hoặc
                Neon
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
                <Label htmlFor="code">Mã *</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  placeholder="DC-PIP-020"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Phân loại</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue="Dụng cụ cầm tay"
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Tên dụng cụ *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spec">Đặc tính kỹ thuật</Label>
              <Input
                id="spec"
                name="spec"
                placeholder="Eppendorf Reference 2, ±0.8%..."
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qty">Tồn kho</Label>
                <Input
                  id="qty"
                  name="qty"
                  type="number"
                  min={0}
                  defaultValue={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minQty">Tối thiểu</Label>
                <Input
                  id="minQty"
                  name="minQty"
                  type="number"
                  min={0}
                  defaultValue={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">ĐVT</Label>
                <Input id="unit" name="unit" defaultValue="cái" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="location">Vị trí</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="P. Đất & PB – Tủ DC1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Trạng thái</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="Sẵn sàng"
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
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                id="calibrationRequired"
                name="calibrationRequired"
                checked={calibRequired}
                onChange={(e) => setCalibRequired(e.target.checked)}
              />
              Cần kiểm định định kỳ (pipet, buret, bình định mức...)
            </label>
            {calibRequired && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lastCalibration">Kiểm định gần nhất</Label>
                  <Input
                    id="lastCalibration"
                    name="lastCalibration"
                    type="date"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nextCalibration">Kiểm định kế tiếp</Label>
                  <Input
                    id="nextCalibration"
                    name="nextCalibration"
                    type="date"
                  />
                </div>
              </div>
            )}
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
                Lưu dụng cụ
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
