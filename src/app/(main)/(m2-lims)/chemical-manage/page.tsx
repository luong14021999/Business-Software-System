import Link from "next/link";
import { CalendarDays, CircleAlert, Search, Tag } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { LabPage, Pager, btn, input } from "@/components/m2/lab-ui/page";
import { XAlert, XTabs } from "@/components/m2/lab-ui/x-tabs";
import { paginate } from "@/components/m2/lab-ui/x-list";
import { CHEMICAL_TABS } from "@/components/m2/manage/chemical-tabs";
import { LotTable } from "@/components/m2/manage/lot-table";
import { chemicalLots } from "@/lib/modules/m2/data/manage";
import { lotAlerts, lotState } from "@/lib/modules/m2/manage";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

type SP = { q?: string; tt?: string; canh?: string; page?: string };
const STATES = ["Còn hàng", "Hết hàng", "Quá hạn", "Đã tiêu hủy"];
const num = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 3 });

/** Quản lý hóa chất tồn kho như XaLab: cảnh báo hạn dùng / sắp hết, bảng tồn theo lô, tiêu hủy, ghi chú. */
export default async function ChemicalManagePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const today = todayISO();
  const [lots, access] = await Promise.all([chemicalLots(), currentAccess()]);
  const q = normalizeVi(sp.q ?? "");
  const rows = lots
    .map((l) => ({ ...l, state: lotState(l, today), alerts: lotAlerts(l, today) }))
    .filter((l) => (sp.tt ? l.state === sp.tt : l.state !== "Đã tiêu hủy"))
    .filter((l) => !sp.canh || (sp.canh === "qua-han" ? l.alerts.expired : sp.canh === "sap-het-han" ? l.alerts.expiring : l.alerts.low))
    .filter((l) => !q || normalizeVi(`${l.chemical} ${l.lotName}`).includes(q));
  const { page, pages, slice } = paginate(rows, sp, 20);
  const url = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, page: undefined, ...patch }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/chemical-manage${p.size ? `?${p}` : ""}`;
  };
  const alert = (key: string, label: string, icon: React.ReactNode) => ({ label, href: url({ canh: sp.canh === key ? undefined : key }), icon, active: sp.canh === key });
  return (
    <LabPage title="Quản lý hóa chất tồn kho">
      <XTabs tabs={CHEMICAL_TABS} active="/chemical-manage" />
      <XAlert
        tone="danger"
        title="Cảnh báo"
        links={[
          alert("qua-han", "Quá hạn sử dụng", <CircleAlert className="h-4 w-4" />),
          alert("sap-het-han", "Sắp hết hạn sử dụng", <Tag className="h-4 w-4 fill-current" />),
          alert("sap-het", "Các hóa chất sắp hết", <CalendarDays className="h-4 w-4" />),
        ]}
      />
      <div className="flex flex-wrap items-center gap-1">
        <div className="flex">
          <Dropdown filter className={`${btn} rounded-r-none`} label={`Trạng thái: ${sp.tt || "Tất cả"}`} items={[{ label: "Tất cả", href: url({ tt: undefined }), active: !sp.tt }, ...STATES.map((s) => ({ label: s, href: url({ tt: s }), active: sp.tt === s }))]} />
          <form action="/chemical-manage" className="-ml-px flex">
            {Object.entries(sp).filter(([k, v]) => v && k !== "q" && k !== "page").map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Từ khóa tìm kiếm..." aria-label="Tìm kiếm" className={`${input} !w-40 rounded-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
          </form>
        </div>
        <Link href="/chemical-manage/stats/su-dung" className={btn}>Thống kê sử dụng hóa chất</Link>
      </div>
      <div className="mt-2">
        <LotTable
          canWrite={access.can("write.lab")}
          rows={slice.map((l) => ({ id: l.id, chemical: l.chemical, lotName: l.lotName, expiry: fmtDateVN(l.expiry), qtyIn: `${num(l.qtyIn)} ${l.unit}`, qtyOut: `${num(l.qtyOut)} ${l.unit}`, remaining: `${num(l.remaining)} ${l.unit}`, state: l.state, note: l.note, danger: l.state === "Quá hạn" || l.alerts.expiring || l.alerts.low }))}
        />
      </div>
      <div className="mt-5"><Pager page={rows.length ? page : 0} pages={pages} href={(p) => `${url({})}${url({}).includes("?") ? "&" : "?"}page=${p}`} /></div>
    </LabPage>
  );
}
