"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, LayoutGrid, MoreHorizontal, X } from "lucide-react";
import { catalogOf, isActiveHref, moduleOf, tabsOf, type NavGroup } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";
import { ModuleActions, ModuleHomeLink } from "@/components/layout/module-chrome";

/** Bảng "Danh mục": ô lớn theo nhóm – dễ bấm trên máy tính bảng ở phòng cấy. */
export function CatalogSheet({ groups, pathname, open, onOpenChange, trigger, title = "Danh mục & các trang khác" }: { groups: NavGroup[]; pathname: string; open: boolean; onOpenChange: (v: boolean) => void; trigger: React.ReactNode; title?: string }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border bg-card p-4 shadow-xl sm:inset-x-auto sm:left-1/2 sm:top-24 sm:bottom-auto sm:w-[min(48rem,92vw)] sm:-translate-x-1/2 sm:rounded-2xl sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Đóng" className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent"><X className="h-5 w-5" /></button>
            </Dialog.Close>
          </div>
          <div className="space-y-5">
            {groups.map((g) => (
              <section key={g.label}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</h3>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {g.items.map((it) => {
                    const Icon = it.icon;
                    const active = isActiveHref(it.href, pathname);
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          onClick={() => onOpenChange(false)}
                          className={cn("flex min-h-16 items-center gap-3 rounded-xl border p-3 text-sm font-medium transition hover:border-primary/50 hover:bg-primary/5", active && "border-primary bg-primary/10 text-primary")}
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                          {it.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            <Link href="/" onClick={() => onOpenChange(false)} className="flex min-h-12 items-center gap-2 rounded-xl border border-dashed px-3 text-sm text-muted-foreground hover:bg-accent">
              <ArrowLeft className="h-4 w-4" />Về trang chủ – các phần mềm
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Khung điều hướng dạng tab (không có menu dọc), hai biến thể:
 * - "bench" (M3.1, dùng tại phòng cấy): tab lớn cho màn hình cảm ứng; điện thoại có thanh tab dưới đáy + "Thêm".
 * - "hub" (M3.2): tab ngang gọn theo khu nghiệp vụ, cuộn ngang trên điện thoại.
 * Cả hai: hàng tab con theo ngữ cảnh, nút Danh mục cho các trang không thuộc tab nào.
 */
export function TabShellNav({ variant, canAdmin = false, canCatalog = false }: { variant: "bench" | "hub"; canAdmin?: boolean; canCatalog?: boolean }) {
  const bench = variant === "bench";
  const pathname = usePathname();
  const mod = moduleOf(pathname);
  const [openDesk, setOpenDesk] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  if (!mod) return null;
  const tabs = tabsOf(mod);
  const catalog = catalogOf(mod);
  const active = tabs.find((t) => t.items.some((i) => isActiveHref(i.href, pathname)));
  const inCatalog = !active && catalog.some((g) => g.items.some((i) => isActiveHref(i.href, pathname)));
  const currentCatalogItem = inCatalog ? catalog.flatMap((g) => g.items).find((i) => isActiveHref(i.href, pathname)) : undefined;
  const mobileTabs = tabs.filter((t) => t.mobile);
  // Trên điện thoại "Thêm" chứa cả tab không lên thanh dưới đáy.
  const mobileMore: NavGroup[] = [{ label: "Khu làm việc", items: tabs.filter((t) => !t.mobile).map((t) => ({ ...t.items[0], label: t.label, icon: t.icon })) }, ...catalog].filter((g) => g.items.length);

  return (
    <>
      {/* Điện thoại (bàn làm việc): thanh tên phần mềm có logo về trang chủ và nút đăng xuất */}
      {bench && (
        <div className="flex shrink-0 items-center gap-2 border-b bg-card px-3 py-1.5 md:hidden">
          <ModuleHomeLink tone="light" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">{mod.name}</span>
          <ModuleActions tone="light" canAdmin={canAdmin} canCatalog={canCatalog} iconOnly={catalog.length > 0} />
        </div>
      )}
      <nav aria-label={mod.name} className={cn("shrink-0 border-b bg-card", bench && "hidden md:block")}>
        <div className="flex items-stretch gap-1 overflow-x-auto px-3 scrollbar-thin lg:px-5">
          <ModuleHomeLink tone="light" className="mr-1 self-center" />
          {tabs.map((t) => {
            const Icon = t.icon;
            const on = t === active;
            return (
              <Link
                key={t.label}
                href={t.items[0]?.href ?? mod.home}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center justify-center font-medium transition-colors",
                  bench ? "min-h-14 min-w-24 flex-col gap-0.5 border-b-[3px] px-3 text-sm" : "min-h-11 gap-2 border-b-2 px-3 text-sm",
                  on ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Icon className={bench ? "h-5 w-5" : "h-4 w-4"} />
                {t.label}
              </Link>
            );
          })}
          {catalog.length > 0 && <div className="ml-auto flex items-center py-2 pl-2">
            <CatalogSheet
              groups={catalog}
              pathname={pathname}
              open={openDesk}
              onOpenChange={setOpenDesk}
              trigger={
                <button type="button" className={cn("inline-flex items-center gap-2 rounded-xl border text-sm font-medium hover:bg-accent", bench ? "min-h-11 px-4" : "min-h-8 px-3", inCatalog && "border-primary bg-primary/10 text-primary")}>
                  <LayoutGrid className={bench ? "h-5 w-5" : "h-4 w-4"} />
                  {currentCatalogItem ? currentCatalogItem.label : "Danh mục"}
                </button>
              }
            />
          </div>}
          <div className={cn("flex items-center py-2 pl-2", catalog.length === 0 && "ml-auto")}>
            <ModuleActions tone="light" canAdmin={canAdmin} canCatalog={canCatalog} iconOnly={catalog.length > 0} />
          </div>
        </div>
        {active && active.items.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto border-t bg-muted/30 px-3 py-1.5 scrollbar-thin lg:px-5">
            {active.items.map((i) => (
              <Link key={i.href} href={i.href} className={cn("inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-medium", isActiveHref(i.href, pathname) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
                {i.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Điện thoại (bàn làm việc): tab con ở trên, tab chính dưới đáy */}
      {bench && active && active.items.length > 1 && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b bg-card px-3 py-1.5 md:hidden">
          {active.items.map((i) => (
            <Link key={i.href} href={i.href} className={cn("inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-medium", isActiveHref(i.href, pathname) ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {i.label}
            </Link>
          ))}
        </div>
      )}
      {bench && <nav aria-label={`${mod.name} – điện thoại`} className="fixed inset-x-0 bottom-0 z-40 grid border-t bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(0,0,0,0.06)] md:hidden" style={{ gridTemplateColumns: `repeat(${mobileTabs.length + 1}, minmax(0, 1fr))` }}>
        {mobileTabs.map((t) => {
          const Icon = t.icon;
          const on = t === active;
          return (
            <Link key={t.label} href={t.items[0]?.href ?? mod.home} aria-current={on ? "page" : undefined} className={cn("flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", on ? "text-primary" : "text-muted-foreground")}>
              <Icon className="h-6 w-6" />
              <span className="truncate px-1">{t.label}</span>
            </Link>
          );
        })}
        <CatalogSheet
          groups={mobileMore}
          pathname={pathname}
          open={openMobile}
          onOpenChange={setOpenMobile}
          trigger={
            <button type="button" className={cn("flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", !active ? "text-primary" : "text-muted-foreground")}>
              <MoreHorizontal className="h-6 w-6" />
              Thêm
            </button>
          }
        />
      </nav>}
    </>
  );
}
