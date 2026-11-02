import { LabPage, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { FilterRow } from "@/components/m2/manage/filter-row";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";

export const dynamic = "force-dynamic";

/** Kế hoạch kiểm định (hiệu chuẩn) thiết bị theo năm, lọc theo hệ thống quản lý; xuất file. */
export default async function InstrumentPlanPage() {
  const systems = [...new Set((await equipmentStore.list()).map((e) => e.managementSystem).filter(Boolean))].sort();
  return (
    <LabPage title="Kế hoạch kiểm định">
      <form action="/api/instrument-manage/plan">
        <FilterRow label="Năm in ra:" htmlFor="year"><input id="year" name="year" inputMode="numeric" defaultValue={new Date().getFullYear() + 1} className={`${input} sm:!w-[165px]`} /></FilterRow>
        <FilterRow label="Hệ thống quản lý:" htmlFor="system">
          <select id="system" name="system" className={`${input} sm:!w-[262px]`}>
            <option value="">Tất cả</option>
            {systems.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FilterRow>
        <div className="py-[10px] sm:pl-[195px]"><button className={btnPrimary}>Xuất kế hoạch</button></div>
      </form>
    </LabPage>
  );
}
