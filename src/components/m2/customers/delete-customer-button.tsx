"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function DeleteCustomerButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onConfirm() {
    setDeleting(true);
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error("Xóa thất bại", body.error ?? `HTTP ${res.status}`);
      return;
    }
    toast.success("Đã xóa", `Đã xóa khách hàng "${name}"`);
    setOpen(false);
    startTransition(() => router.refresh());
  }

  const busy = deleting || pending;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Xóa ${name}`}
          className="h-8 gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Xóa
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-card border rounded-xl shadow-xl p-5 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold">
                Xác nhận xóa
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Bạn có chắc chắn muốn xóa khách hàng{" "}
                <span className="font-medium text-foreground">
                  &quot;{name}&quot;
                </span>
                ? Hành động này không thể hoàn tác.
              </Dialog.Description>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={busy}>
                Hủy
              </Button>
            </Dialog.Close>
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={busy}
              className="gap-1.5 bg-rose-600 text-white hover:bg-rose-700"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Xóa
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
