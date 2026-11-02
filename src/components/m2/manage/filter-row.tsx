import type { ReactNode } from "react";
import { input } from "@/components/m2/lab-ui/page";

/** Dòng form lọc ngang như các trang Quản lý / Thống kê của XaLab: nhãn đậm (195px), ô nhập, "đến:", ô nhập, nút. */
export function FilterRow({ label, htmlFor, children, line = false }: { label?: string; htmlFor?: string; children: ReactNode; line?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-y-2 py-[10px] ${line ? "border-b border-[#eee] pb-5" : ""}`}>
      <label htmlFor={htmlFor} className="w-full pr-[30px] text-sm font-bold sm:w-[195px]">{label}</label>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[30px] gap-y-2">{children}</div>
    </div>
  );
}

export const DateInput = ({ id, name, defaultValue }: { id: string; name: string; defaultValue?: string }) => (
  <input id={id} name={name} type="date" defaultValue={defaultValue} className={`${input} sm:!w-[165px]`} />
);

/** "Từ ngày … đến: …" cùng một dòng. */
export function DateRange({ from, to, fromName = "from", toName = "to", children }: { from?: string; to?: string; fromName?: string; toName?: string; children?: ReactNode }) {
  return (
    <>
      <DateInput id={fromName} name={fromName} defaultValue={from} />
      <span className="flex items-center gap-[30px]"><label htmlFor={toName} className="text-sm font-bold">đến:</label><DateInput id={toName} name={toName} defaultValue={to} /></span>
      {children}
    </>
  );
}
