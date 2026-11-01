import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Khung trang nghiệp vụ phòng thí nghiệm: nội dung ở giữa, tiêu đề lớn, thanh công cụ bên dưới. */
export function LabPage({ title, subtitle, toolbar, children, wide = false }: { title: ReactNode; subtitle?: ReactNode; toolbar?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <main className="flex-1 overflow-y-auto bg-white scrollbar-thin">
      <div className={cn("mx-auto px-4 pb-10 pt-5", wide ? "max-w-[1500px]" : "max-w-[1170px]")}>
        <h1 className="text-[28px] font-medium leading-tight text-[#333] sm:text-[30px]">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
        {toolbar && <div className="mt-3 flex flex-wrap items-center gap-1.5">{toolbar}</div>}
        <div className="mt-4">{children}</div>
      </div>
    </main>
  );
}

/** Nút kiểu thanh công cụ (viền xám, nền trắng). */
export const btn = "inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded border border-[#ccc] bg-white px-3 text-sm text-[#333] hover:bg-[#e6e6e6] disabled:opacity-50";
/** Nút chính (xanh dương đậm). */
export const btnPrimary = "inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded border border-[#2e6da4] bg-[#337ab7] px-3 text-sm text-white hover:bg-[#286090] disabled:opacity-50";
/** Nút nhỏ trong bảng. */
export const btnXs = "inline-flex h-[22px] items-center gap-1 rounded-sm border border-[#ccc] bg-white px-1.5 text-xs text-[#333] hover:bg-[#e6e6e6]";
/** Ô nhập. */
export const input = "h-[34px] w-full rounded border border-[#ccc] bg-white px-3 text-sm shadow-[inset_0_1px_1px_rgba(0,0,0,0.075)] focus:border-[#66afe9] focus:outline-none focus:ring-2 focus:ring-[#66afe9]/40";
/** Bảng: tiêu đề đậm, đường kẻ ngang giữa các dòng. */
export const table = "w-full border-collapse text-sm text-[#333] [&_th]:border-b-2 [&_th]:border-[#ddd] [&_th]:px-2 [&_th]:py-2 [&_th]:text-left [&_th]:align-bottom [&_th]:whitespace-nowrap [&_th]:font-bold [&_td]:border-t [&_td]:border-[#ddd] [&_td]:px-2 [&_td]:py-2 [&_td]:align-top";
/** Đường dẫn trong bảng. */
export const link = "text-[#337ab7] hover:text-[#23527c] hover:underline";

/** Phân trang đơn giản (trang hiện tại / tổng số trang). */
export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return <div className="mt-3 text-sm text-muted-foreground">Trang {pages ? 1 : 0} / {pages}</div>;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1 text-sm">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <a key={p} href={href(p)} className={cn("inline-flex h-8 min-w-8 items-center justify-center rounded border px-2", p === page ? "border-[#337ab7] bg-[#337ab7] text-white" : "border-[#ddd] text-[#337ab7] hover:bg-[#eee]")}>
          {p}
        </a>
      ))}
      <span className="ml-2 text-muted-foreground">Trang {page} / {pages}</span>
    </div>
  );
}
