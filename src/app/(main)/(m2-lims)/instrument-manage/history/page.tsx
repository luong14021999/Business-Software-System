import { LabPage, Pager, btnPrimary, input, table } from "@/components/m2/lab-ui/page";
import { paginate } from "@/components/m2/lab-ui/x-list";
import { DateRange, FilterRow } from "@/components/m2/manage/filter-row";
import { calibrationLogStore } from "@/lib/modules/m2/data/calibration-logs";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { filterCalibrations, type CalibrationFilter } from "@/lib/modules/m2/manage";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const API = "/api/instrument-manage/history";

/** Lịch sử hiệu chuẩn như XaLab: lọc theo thiết bị, khoảng ngày hiệu chuẩn nội bộ / định kỳ; xem hoặc xuất Excel. */
export default async function CalibrationHistoryPage({ searchParams }: { searchParams: Promise<CalibrationFilter & { page?: string }> }) {
  const sp = await searchParams;
  const [logs, equipment] = await Promise.all([calibrationLogStore.list(), equipmentStore.list()]);
  const name = new Map(equipment.map((e) => [e.id, `${e.code} – ${e.name}`]));
  const rows = sp.mode ? filterCalibrations(logs, sp) : [];
  const { page, pages, slice } = paginate(rows, sp);
  const qs = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => Boolean(e[1]) && e[0] !== "page"));
  return (
    <LabPage title="Lịch sử hiệu chuẩn">
      <form action="/instrument-manage/history">
        <FilterRow label="Tên thiết bị:" htmlFor="eq" line>
          <select id="eq" name="eq" defaultValue={sp.eq ?? ""} className={`${input} sm:!w-[262px]`}>
            <option value="" />
            {equipment.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })).map((e) => <option key={e.id} value={e.id}>{e.code} – {e.name}</option>)}
          </select>
        </FilterRow>
        <FilterRow label="Hiệu chuẩn nội bộ:" htmlFor="ifrom" line>
          <DateRange from={sp.ifrom} to={sp.ito} fromName="ifrom" toName="ito">
            <span className="flex gap-1"><button name="mode" value="noi-bo" className={btnPrimary}>Hiện lịch sử</button><button name="mode" value="noi-bo" formAction={API} className={btnPrimary}>Xuất Excel</button></span>
          </DateRange>
        </FilterRow>
        <FilterRow label="Hiệu chuẩn định kỳ:" htmlFor="pfrom" line>
          <DateRange from={sp.pfrom} to={sp.pto} fromName="pfrom" toName="pto">
            <span className="flex gap-1"><button name="mode" value="dinh-ky" className={btnPrimary}>Hiện lịch sử</button><button name="mode" value="dinh-ky" formAction={API} className={btnPrimary}>Xuất Excel</button></span>
          </DateRange>
        </FilterRow>
        <div className="flex gap-1 py-5">
          <button name="mode" value="all" className={btnPrimary}>Hiện toàn bộ lịch sử</button>
          <button name="mode" value="all" formAction={API} className={btnPrimary}>Xuất Excel</button>
        </div>
      </form>
      <table className={table}>
        <thead><tr><th>Tên thiết bị</th><th>Ngày hiệu chuẩn nội bộ</th><th>Người thực hiện</th><th>Ngày hiệu chuẩn định kỳ</th><th>Đơn vị thực hiện</th><th>Tình trạng</th></tr></thead>
        <tbody>
          {sp.mode && slice.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>}
          {slice.map((l) => (
            <tr key={l.id}><td>{name.get(l.equipmentId ?? "") ?? l.equipmentName}</td><td>{fmtDateVN(l.internalDate)}</td><td>{l.internalBy}</td><td>{fmtDateVN(l.date)}</td><td>{l.place}</td><td>{l.condition}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5"><Pager page={rows.length ? page : 0} pages={pages} href={(p) => `/instrument-manage/history?${qs}&page=${p}`} /></div>
    </LabPage>
  );
}
