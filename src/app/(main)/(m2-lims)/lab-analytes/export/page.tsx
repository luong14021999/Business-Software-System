import { LabPage, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { FilterRow } from "@/components/m2/manage/filter-row";
import { sampleTypeStore } from "@/lib/modules/m2/data/orders";

export const dynamic = "force-dynamic";

/** Xuất Excel danh sách chỉ tiêu theo loại mẫu (như XaLab); file xuất ra dùng luôn làm file mẫu để nhập. */
export default async function AnalyteExportPage() {
  const types = (await sampleTypeStore.list()).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "vi"));
  return (
    <LabPage title="Xuất Excel danh sách chỉ tiêu">
      <form action="/api/lab-analytes/export">
        <FilterRow label="Loại mẫu:" htmlFor="type">
          <select id="type" name="type" className={`${input} sm:!w-[262px]`}>
            <option value="">Tất cả</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </FilterRow>
        <div className="py-[10px] sm:pl-[195px]"><button className={btnPrimary}>Xuất Excel</button></div>
      </form>
    </LabPage>
  );
}
