import Link from "next/link";
import { CalendarDays, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

/** Hai tab đầu trang chủ phòng thí nghiệm: Bảng tin · Lịch công tác. */
export function HomeTabs({ active }: { active: "news" | "schedule" }) {
  const tab = "inline-flex h-[34px] items-center gap-1.5 border border-[#ccc] px-3 text-sm text-[#333]";
  return (
    <div className="inline-flex">
      <Link href="/lims" className={cn(tab, "rounded-l", active === "news" ? "bg-[#e6e6e6] shadow-[inset_0_3px_5px_rgba(0,0,0,0.125)]" : "bg-white hover:bg-[#e6e6e6]")}>
        <LayoutGrid className="h-4 w-4" aria-hidden />Bảng tin
      </Link>
      <Link href="/work-schedule" className={cn(tab, "-ml-px rounded-r", active === "schedule" ? "bg-[#e6e6e6] shadow-[inset_0_3px_5px_rgba(0,0,0,0.125)]" : "bg-white hover:bg-[#e6e6e6]")}>
        <CalendarDays className="h-4 w-4" aria-hidden />Lịch công tác
      </Link>
    </div>
  );
}
