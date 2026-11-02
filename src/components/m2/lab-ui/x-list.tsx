import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Copy, List, Plus, Search } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { LabPage, Pager, btn, input, link, table } from "@/components/m2/lab-ui/page";

export type XListRow = { id: string; no: number; href: string; cells: ReactNode[]; actions?: ReactNode };

/**
 * Trang danh sách kiểu XaLab: [Thêm +][Trạng thái ▾] + ô tìm kiếm, bảng (cột đầu là link sang trang sửa),
 * các thao tác ở cuối dòng, phân trang 10 dòng.
 */
export function XListPage({
  title,
  basePath,
  sp,
  newHref,
  headers,
  rows,
  total,
  page,
  pages,
  showIndex = false,
  searchPlaceholder = "Từ khóa tìm kiếm...",
  statusFilter = true,
  extraToolbar,
  extraFilters,
  footer,
  backHref,
}: {
  title: string;
  basePath: string;
  sp: Record<string, string | undefined>;
  newHref?: string;
  headers: string[];
  rows: XListRow[];
  total: number;
  page: number;
  pages: number;
  showIndex?: boolean;
  searchPlaceholder?: string;
  statusFilter?: boolean;
  extraToolbar?: ReactNode;
  /** Bộ lọc thêm (VD Loại mẫu) đặt cạnh nút Trạng thái. */
  extraFilters?: ReactNode;
  footer?: ReactNode;
  /** Nút [←] đứng đầu nhóm nút (trang con, VD liên lạc của khách hàng). */
  backHref?: string;
}) {
  const url = (patch: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = { ...sp, page: undefined, ...patch };
    const p = new URLSearchParams(Object.entries(merged).filter((e): e is [string, string] => Boolean(e[1])));
    return `${basePath}${p.size ? `?${p}` : ""}`;
  };
  const status = sp.status ?? "";
  const STATUS = [
    { key: "", label: "Tất cả" },
    { key: "dang-dung", label: "Đang dùng" },
    { key: "ngung", label: "Ngừng dùng" },
  ];
  const grouped = "rounded-none first:rounded-l last:rounded-r -ml-px first:ml-0";
  return (
    <LabPage
      title={title}
      rule={false}
      toolbar={
        <>
          <div className="flex">
            {backHref && <Link href={backHref} className={`${btn} ${grouped}`} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>}
            {newHref && <Link href={newHref} className={`${btn} ${grouped}`}>Thêm <Plus className="h-4 w-4 stroke-[3]" /></Link>}
            {statusFilter && (
              <Dropdown
                filter
                className={`${btn} ${newHref ? "-ml-px rounded-l-none" : ""}`}
                label={`Trạng thái: ${STATUS.find((s) => s.key === status)?.label ?? "Tất cả"}`}
                items={STATUS.map((s) => ({ label: s.label, href: url({ status: s.key || undefined }), active: status === s.key }))}
              />
            )}
            {extraFilters}
          </div>
          <form action={basePath} className="flex">
            {Object.entries(sp).filter(([k, v]) => v && k !== "q" && k !== "page").map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <input name="q" defaultValue={sp.q ?? ""} placeholder={searchPlaceholder} aria-label="Tìm kiếm" className={`${input} !w-44 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
          </form>
          {extraToolbar}
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              {showIndex && <th className="w-12">#</th>}
              {headers.map((h) => <th key={h}>{h}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={headers.length + 2} className="py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                {showIndex && <td>{r.no}</td>}
                {r.cells.map((c, i) => <td key={i}>{i === 0 ? <Link href={r.href} className={link}>{c}</Link> : c}</td>)}
                <td className="whitespace-nowrap text-right">{r.actions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5">
        <Pager page={total ? page : 0} pages={pages} href={(p) => `${url({})}${url({}).includes("?") ? "&" : "?"}page=${p}`} />
      </div>
      {footer}
    </LabPage>
  );
}

/** Phân trang + tìm kiếm + lọc trạng thái cho một danh sách. */
export function paginate<T>(items: T[], sp: { page?: string }, perPage = 10) {
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  return { page, pages: items.length ? pages : 0, slice: items.slice((page - 1) * perPage, page * perPage) };
}

const ICONS = { list: List, calendar: CalendarDays, copy: Copy } as const;

/** Các link thao tác cuối dòng kiểu XaLab: "Liên lạc ☰ | Địa điểm ☰ | … | Xóa ✖". */
export function XActionLinks({ links, del }: { links: { label: string; href: string; icon?: keyof typeof ICONS }[]; del?: ReactNode }) {
  const items: ReactNode[] = links.map((l) => {
    const Icon = l.icon ? ICONS[l.icon] : null;
    return (
      <Link key={l.href} href={l.href} className={`${link} inline-flex items-center gap-1`}>
        {l.label}
        {Icon && <Icon className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />}
      </Link>
    );
  });
  if (del) items.push(<span key="del">{del}</span>);
  return (
    <span className="inline-flex items-center justify-end gap-x-2 whitespace-nowrap">
      {items.map((x, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && <span className="text-[#333]">|</span>}
          {x}
        </span>
      ))}
    </span>
  );
}
