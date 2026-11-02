import Link from "next/link";
import { CalendarDays, CircleAlert, Search, Tag } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { LabPage, Pager, btn, input, link, table } from "@/components/m2/lab-ui/page";
import { XAlert, XTabs } from "@/components/m2/lab-ui/x-tabs";
import { paginate } from "@/components/m2/lab-ui/x-list";
import { INSTRUMENT_TABS } from "@/components/m2/manage/instrument-data";
import { instrumentRows } from "@/lib/modules/m2/data/manage";
import { EQUIPMENT_CONDITIONS } from "@/lib/modules/m2/data/manage";
import { calibrationState } from "@/lib/modules/m2/manage";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

type SP = { q?: string; tt?: string; kho?: string; canh?: string; page?: string };

/** Hiệu chuẩn / tồn kho thiết bị như XaLab: thông báo hạn hiệu chuẩn, lọc tình trạng / tồn kho, bảng thiết bị. */
export default async function InstrumentManagePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const today = todayISO();
  const all = (await instrumentRows()).filter((e) => e.active !== false);
  const q = normalizeVi(sp.q ?? "");
  const rows = all
    .filter((e) => !sp.tt || (e.condition || "Không rõ") === sp.tt)
    .filter((e) => !sp.kho || (sp.kho === "co" ? e.inStock : !e.inStock))
    .filter((e) => !sp.canh || calibrationState(e.due, today) === sp.canh)
    .filter((e) => !q || normalizeVi(`${e.code} ${e.name} ${e.typeName}`).includes(q));
  const { page, pages, slice } = paginate(rows, sp);
  const url = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, page: undefined, ...patch }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/instrument-manage${p.size ? `?${p}` : ""}`;
  };
  const alert = (key: string, label: string, icon: React.ReactNode) => ({ label, href: url({ canh: sp.canh === key ? undefined : key }), icon, active: sp.canh === key });
  return (
    <LabPage title="Hiệu chuẩn/Tồn kho thiết bị">
      <XTabs tabs={INSTRUMENT_TABS} active="/instrument-manage" />
      <XAlert
        tone="info"
        title="Thông báo"
        links={[
          alert("qua-han", "Cảnh báo quá hạn", <CircleAlert className="h-4 w-4" />),
          alert("sap", "Thiết bị sắp hiệu chuẩn", <CalendarDays className="h-4 w-4" />),
          alert("hom-nay", "Hôm nay", <Tag className="h-4 w-4 fill-current" />),
        ]}
      />
      <div className="flex flex-wrap items-center gap-1">
        <div className="flex">
          <Dropdown filter className={`${btn} rounded-r-none`} label={`Tình trạng: ${sp.tt || "Tất cả"}`} items={[{ label: "Tất cả", href: url({ tt: undefined }), active: !sp.tt }, ...EQUIPMENT_CONDITIONS.map((c) => ({ label: c, href: url({ tt: c }), active: sp.tt === c }))]} />
          <Dropdown
            filter
            className={`${btn} -ml-px rounded-none`}
            label={`Tồn kho: ${sp.kho === "co" ? "Trong kho" : sp.kho === "khong" ? "Đã xuất kho" : "Tất cả"}`}
            items={[{ label: "Tất cả", href: url({ kho: undefined }), active: !sp.kho }, { label: "Trong kho", href: url({ kho: "co" }), active: sp.kho === "co" }, { label: "Đã xuất kho", href: url({ kho: "khong" }), active: sp.kho === "khong" }]}
          />
          <form action="/instrument-manage" className="-ml-px flex">
            {Object.entries(sp).filter(([k, v]) => v && k !== "q" && k !== "page").map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Từ khóa tìm kiếm..." aria-label="Tìm kiếm" className={`${input} !w-44 rounded-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
          </form>
        </div>
        <Link href="/instrument-manage/history" className={btn}>Lịch sử hiệu chuẩn</Link>
        <Link href="/instrument-manage/handover" className={btn}>Sổ giao nhận</Link>
        <Link href="/instrument-manage/plan" className={btn}>Kế hoạch kiểm định</Link>
      </div>
      <hr className="my-5 border-[#eee]" />
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr><th>ID</th><th>Mã</th><th>Thiết bị</th><th>Loại thiết bị</th><th>Hiệu chuẩn nội bộ</th><th>Người thực hiện</th><th>Hiệu chuẩn định kỳ</th><th>Đơn vị hiệu chuẩn</th><th>Tình trạng</th><th>Tồn kho</th></tr>
          </thead>
          <tbody>
            {slice.length === 0 && <tr><td colSpan={10} className="py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>}
            {slice.map((e) => {
              const st = calibrationState(e.due, today);
              return (
                <tr key={e.id}>
                  <td>{e.no}</td>
                  <td className="whitespace-nowrap"><Link href={`/instrument-manage/calibrate/${e.id}`} className={link}>{e.code}</Link></td>
                  <td>{e.name}</td>
                  <td>{e.typeName}</td>
                  <td className="whitespace-nowrap">{fmtDateVN(e.internalDate)}</td>
                  <td>{e.internalBy}</td>
                  <td className="whitespace-nowrap">
                    {fmtDateVN(e.periodicDate)}
                    {e.due && <div className={`text-xs ${st === "qua-han" ? "font-bold text-[#a94442]" : st ? "text-[#8a6d3b]" : "text-[#777]"}`}>Hạn: {fmtDateVN(e.due)}</div>}
                  </td>
                  <td>{e.calibrationUnit}</td>
                  <td>{e.condition || "Không rõ"}</td>
                  <td>{e.inStock ? "Trong kho" : "Đã xuất kho"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-5"><Pager page={rows.length ? page : 0} pages={pages} href={(p) => `${url({})}${url({}).includes("?") ? "&" : "?"}page=${p}`} /></div>
    </LabPage>
  );
}
