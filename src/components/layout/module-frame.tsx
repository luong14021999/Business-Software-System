"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TabShellNav } from "@/components/layout/shells/tab-shell-nav";
import { ConsoleBar } from "@/components/layout/shells/console-bar";
import { TopNav } from "@/components/layout/shells/top-nav";
import { DeniedPermissions, moduleOf, shellOf } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

/** Khung điều hướng theo từng phần mềm: menu ngang (phòng thí nghiệm), bàn làm việc dạng tab (nuôi cấy mô), tab theo khu nghiệp vụ (giống) hoặc bảng điều khiển quản trị (nền tảng dùng chung). */
export function ModuleFrame({ children, canAdmin = false, denied = [] }: { children: React.ReactNode; canAdmin?: boolean; /** Quyền xem bị từ chối → ẩn mục menu tương ứng. */ denied?: string[] }) {
  return <DeniedPermissions value={denied}><Frame canAdmin={canAdmin}>{children}</Frame></DeniedPermissions>;
}

function Frame({ children, canAdmin }: { children: React.ReactNode; canAdmin: boolean }) {
  const shell = shellOf(moduleOf(usePathname()));
  if (shell === "topnav") {
    return (
      // Phong cách XaLab (Bootstrap 3): Helvetica/Arial 14px cho cả thanh menu và nội dung.
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden text-[14px] [font-family:'Helvetica_Neue',Helvetica,Arial,sans-serif]">
        <TopNav />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">{children}</div>
      </div>
    );
  }
  if (shell === "console") {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <ConsoleBar canAdmin={canAdmin} />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">{children}</div>
      </div>
    );
  }
  if (shell === "bench" || shell === "hub") {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <TabShellNav variant={shell} />
        <div className={cn("flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden", shell === "bench" && "pb-16 md:pb-0")}>{children}</div>
      </div>
    );
  }
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}
