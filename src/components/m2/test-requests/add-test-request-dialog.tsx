"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { btn } from "@/components/m2/lab-ui/page";

const STATUSES = [
  "Yêu cầu mới",
  "Đã báo giá",
  "KH chấp nhận",
  "Đã ký HĐ",
  "Đã nhận mẫu",
  "Đã hủy",
];

export function AddTestRequestDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setError(null);
    const criteriaRaw = String(formData.get("criteria") ?? "");
    const criteria = criteriaRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        method: "TCVN",
        unitPrice: 200000,
      }));
    const payload = {
      code: String(formData.get("code") ?? "").trim(),
      customer: String(formData.get("customer") ?? "").trim(),
      customerCode: "",
      contact: String(formData.get("contact") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      matrix: String(formData.get("matrix") ?? "").trim(),
      expectedSamples: Number(formData.get("expectedSamples") ?? 1),
      criteria,
      purpose: String(formData.get("purpose") ?? "").trim(),
      decisionRule: String(formData.get("decisionRule") ?? "Simple acceptance"),
      expectedDeliveryDays: Number(formData.get("expectedDeliveryDays") ?? 7),
      vatRate: Number(formData.get("vatRate") ?? 0),
      status: String(formData.get("status") ?? "Yêu cầu mới"),
    };
    const res = await fetch("/api/test-requests", {
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
          Thêm <Plus className="h-4 w-4 stroke-[3]" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-xl bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Phiếu yêu cầu thử nghiệm mới
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Ghi vào <code className="font-mono">data/test-requests.json</code>
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
                <Label htmlFor="code">Mã YC *</Label>
                <Input id="code" name="code" required placeholder="YC-VNNTH-2026-00126" className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Trạng thái</Label>
                <select id="status" name="status" defaultValue="Yêu cầu mới" className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer">Khách hàng *</Label>
              <Input id="customer" name="customer" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact">Đầu mối liên hệ</Label>
                <Input id="contact" name="contact" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Điện thoại</Label>
                <Input id="phone" name="phone" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="matrix">Loại mẫu *</Label>
                <Input id="matrix" name="matrix" required placeholder="Đất / Nước / Rau..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expectedSamples">Số mẫu dự kiến</Label>
                <Input id="expectedSamples" name="expectedSamples" type="number" defaultValue={1} min={1} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Mục đích yêu cầu</Label>
              <Input id="purpose" name="purpose" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="criteria">Chỉ tiêu (cách bằng dấu phẩy)</Label>
              <Input id="criteria" name="criteria" placeholder="pH, OM%, N tổng..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="decisionRule">Quy tắc quyết định</Label>
              <Input id="decisionRule" name="decisionRule" defaultValue="Simple acceptance" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="expectedDeliveryDays">Hạn trả (ngày)</Label>
                <Input id="expectedDeliveryDays" name="expectedDeliveryDays" type="number" defaultValue={7} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vatRate">VAT (%)</Label>
                <Input id="vatRate" name="vatRate" type="number" defaultValue={0} />
              </div>
            </div>
            {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2.5 py-2">{error}</div>}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Dialog.Close asChild><Button variant="outline" type="button">Hủy</Button></Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu yêu cầu
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
