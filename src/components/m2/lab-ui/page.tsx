import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Khung trang nghiệp vụ phòng thí nghiệm (theo XaLab): khung 1170px, tiêu đề lớn, gạch ngang, thanh công cụ, nội dung,
 * cuối trang gạch ngang và dòng bản quyền.
 */
export function LabPage({ title, subtitle, toolbar, children, wide = false, rule = true }: { title: ReactNode; subtitle?: ReactNode; toolbar?: ReactNode; children: ReactNode; wide?: boolean; /** Gạch ngang dưới tiêu đề (một số trang XaLab không có). */ rule?: boolean }) {
  return (
    <main className="flex-1 overflow-y-auto bg-white scrollbar-thin">
      <div className={cn("mx-auto px-[15px] pb-6 pt-5", wide ? "max-w-[1500px]" : "max-w-[1170px]")}>
        <h1 className="text-[28px] font-medium leading-tight text-[#333] sm:text-[30px]">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
        {rule ? <hr className="my-5 border-[#eee]" /> : <div className="h-2.5" />}
        {toolbar && <div className="mb-4 flex flex-wrap items-center gap-1.5">{toolbar}</div>}
        <div>{children}</div>
        <LabFooter />
      </div>
    </main>
  );
}

/** Chân trang như XaLab: gạch ngang và dòng bản quyền của Viện. */
export function LabFooter() {
  return (
    <footer className="mt-10">
      <hr className="mb-5 border-[#eee]" />
      <p className="text-sm text-[#333]">© {new Date().getFullYear()} - Viện Nông nghiệp Thanh Hóa</p>
    </footer>
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

/** Phân trang kiểu XaLab (Bootstrap): các ô số dính liền, « » chuyển trang, "Trang x / y". */
export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return <div className="mt-3 px-3 text-sm text-[#333]">Trang {pages ? 1 : 0} / {pages}</div>;
  const cell = "-ml-px inline-flex h-[34px] min-w-[34px] items-center justify-center border px-3 first:ml-0 first:rounded-l last:rounded-r";
  // Tối đa 10 ô quanh trang hiện tại như XaLab.
  const from = Math.max(1, Math.min(page - 4, pages - 9));
  const nums = Array.from({ length: Math.min(10, pages) }, (_, i) => from + i);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <div className="flex">
        {page > 1 && <a href={href(page - 1)} className={cn(cell, "border-[#ddd] text-[#337ab7] hover:bg-[#eee]")} aria-label="Trang trước">«</a>}
        {nums.map((p) => (
          <a key={p} href={href(p)} aria-current={p === page ? "page" : undefined} className={cn(cell, p === page ? "relative z-10 border-[#337ab7] bg-[#337ab7] text-white" : "border-[#ddd] text-[#337ab7] hover:bg-[#eee]")}>
            {p}
          </a>
        ))}
        {page < pages && <a href={href(page + 1)} className={cn(cell, "border-[#ddd] text-[#337ab7] hover:bg-[#eee]")} aria-label="Trang sau">»</a>}
      </div>
      <span className="text-[#333]">Trang {page} / {pages}</span>
    </div>
  );
}
