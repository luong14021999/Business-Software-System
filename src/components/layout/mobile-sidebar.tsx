"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import {
  SidebarBrand,
  SidebarNav,
} from "@/components/layout/nav-config";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Mở menu điều hướng"
          className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background text-foreground hover:bg-accent transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="md:hidden fixed inset-0 z-50 bg-black/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="md:hidden fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[300px] flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-200"
        >
          <Dialog.Title className="sr-only">Menu điều hướng</Dialog.Title>
          <div className="relative">
            <SidebarBrand />
            <Dialog.Close asChild>
              <button
                aria-label="Đóng menu"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-md text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
