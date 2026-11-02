"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { btn } from "@/components/m2/lab-ui/page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROOMS = [
  "P. Đất & Phân bón",
  "P. Dư lượng BVTV",
  "P. Chuẩn bị mẫu",
  "P. Kim loại nặng",
  "Kho hóa chất",
  "Kho mẫu lưu",
  "Tủ chuẩn lạnh",
];

const PARAMETERS = ["Nhiệt độ", "Độ ẩm"] as const;

const DEFAULTS: Record<string, { unit: string; limit: string; device: string }> = {
  "Nhiệt độ": {
    unit: "°C",
    limit: "20 – 25 °C",
    device: "Nhiệt kế Hanna HI-91410",
  },
  "Độ ẩm": {
    unit: "%RH",
    limit: "≤ 65 %RH",
    device: "Ẩm kế Testo 174H",
  },
};

export function AddEnvironmentReadingDialog({
  defaultRoom,
  defaultParameter,
}: {
  defaultRoom?: string;
  defaultParameter?: "Nhiệt độ" | "Độ ẩm";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [parameter, setParameter] = useState<"Nhiệt độ" | "Độ ẩm">(
    defaultParameter ?? "Nhiệt độ",
  );
  const router = useRouter();
  const def = DEFAULTS[parameter];

  async function onSubmit(formData: FormData) {
    setError(null);
    const payload = {
      room: String(formData.get("room") ?? "").trim(),
      monitoringDevice: String(formData.get("monitoringDevice") ?? "").trim(),
      parameter: String(formData.get("parameter") ?? parameter) as
        | "Nhiệt độ"
        | "Độ ẩm",
      value: Number(formData.get("value") ?? 0),
      unit: String(formData.get("unit") ?? def.unit),
      limit: String(formData.get("limit") ?? def.limit),
      recordedAt: String(formData.get("recordedAt") ?? "").replace("T", " "),
      observer: String(formData.get("observer") ?? "").trim(),
      pass: formData.get("pass") === "true",
      note: String(formData.get("note") ?? "").trim() || undefined,
    };
    const res = await fetch("/api/environment", {
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

  const nowLocal = new Date().toISOString().slice(0, 16);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={btn}>
          Ghi nhận đo <Plus className="h-4 w-4 stroke-[3]" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Ghi nhận theo dõi môi trường
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                AEMD-BM-10.02 · lưu 1 lần đo cho phòng × thông số
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
                <Label htmlFor="room">Phòng *</Label>
                <select
                  id="room"
                  name="room"
                  required
                  defaultValue={defaultRoom ?? ""}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="" disabled>
                    Chọn phòng…
                  </option>
                  {ROOMS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parameter">Thông số *</Label>
                <select
                  id="parameter"
                  name="parameter"
                  value={parameter}
                  onChange={(e) =>
                    setParameter(e.target.value as "Nhiệt độ" | "Độ ẩm")
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {PARAMETERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monitoringDevice">Thiết bị dùng để kiểm soát</Label>
              <Input
                id="monitoringDevice"
                name="monitoringDevice"
                defaultValue={def.device}
                placeholder="Nhiệt kế Hanna HI-91410…"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="value">Giá trị đo *</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  step="0.1"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">ĐVT</Label>
                <Input
                  id="unit"
                  name="unit"
                  defaultValue={def.unit}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="limit">Giới hạn</Label>
                <Input
                  id="limit"
                  name="limit"
                  defaultValue={def.limit}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="recordedAt">Thời điểm đo</Label>
                <Input
                  id="recordedAt"
                  name="recordedAt"
                  type="datetime-local"
                  defaultValue={nowLocal}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="observer">Người theo dõi</Label>
                <Input id="observer" name="observer" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nhận xét *</Label>
              <div className="flex gap-4 text-sm">
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="pass"
                    value="true"
                    defaultChecked
                  />
                  <span className="font-semibold text-emerald-700">Đạt (Đ)</span>
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input type="radio" name="pass" value="false" />
                  <span className="font-semibold text-rose-700">
                    Không đạt (K)
                  </span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Ghi chú</Label>
              <Input
                id="note"
                name="note"
                placeholder="Vd: Bật thêm điều hòa..."
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
                Lưu lần đo
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
