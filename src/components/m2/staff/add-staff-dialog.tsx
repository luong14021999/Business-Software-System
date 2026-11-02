"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { btn } from "@/components/m2/lab-ui/page";

const STATUSES = ["Đang làm việc", "Nghỉ phép", "Thử việc"];

export function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setError(null);
    const competenciesRaw = String(formData.get("competencies") ?? "");
    const payload = {
      code: String(formData.get("code") ?? "").trim(),
      fullName: String(formData.get("fullName") ?? "").trim(),
      position: String(formData.get("position") ?? "").trim(),
      department: String(formData.get("department") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      joinedAt: String(formData.get("joinedAt") ?? ""),
      competencies: competenciesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      trainings: [],
      status: String(formData.get("status") ?? "Đang làm việc"),
    };
    const res = await fetch("/api/staff", {
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
          Thêm nhân sự <Plus className="h-4 w-4 stroke-[3]" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Thêm nhân sự PTN
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Ghi vào <code className="font-mono">data/staff.json</code>
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
                <Label htmlFor="code">Mã NV *</Label>
                <Input id="code" name="code" required placeholder="NV-VNNTH-0125" className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Trạng thái</Label>
                <select id="status" name="status" defaultValue="Đang làm việc" className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Họ tên *</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="position">Chức danh</Label>
                <Input id="position" name="position" placeholder="Kỹ thuật viên..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department">Nhóm chuyên môn</Label>
                <Input id="department" name="department" placeholder="Nhóm Đất & Phân bón" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Điện thoại</Label>
                <Input id="phone" name="phone" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joinedAt">Ngày vào làm</Label>
              <Input id="joinedAt" name="joinedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="competencies">Năng lực (cách bằng dấu phẩy)</Label>
              <Input id="competencies" name="competencies" placeholder="ICP-MS, HPLC, QuEChERS..." />
            </div>
            {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2.5 py-2">{error}</div>}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Dialog.Close asChild><Button variant="outline" type="button">Hủy</Button></Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu nhân sự
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
