import { notFound } from "next/navigation";
import { LabPage, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { DateRange, FilterRow } from "@/components/m2/manage/filter-row";
import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";

export const dynamic = "force-dynamic";

const TITLES: Record<string, [string, string]> = {
  "nhap-kho": ["Thống kê nhập kho hóa chất", "Từ ngày nhập kho:"],
  "su-dung": ["Thống kê sử dụng hóa chất", "Từ ngày xuất kho:"],
};

/** Thống kê nhập kho / sử dụng hóa chất như XaLab: khoảng ngày, hóa chất, Xuất Excel. */
export default async function ChemicalStatPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const t = TITLES[kind];
  if (!t) notFound();
  const chemicals = (await chemicalsStore.list()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return (
    <LabPage title={t[0]}>
      <form action={`/api/chemical-stats/${kind}`}>
        <FilterRow label={t[1]} htmlFor="from"><DateRange /></FilterRow>
        <FilterRow label="Hóa chất" htmlFor="chemical">
          <select id="chemical" name="chemical" className={`${input} sm:!w-[360px]`}>
            <option value="">- Chọn hóa chất -</option>
            {chemicals.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FilterRow>
        <div className="py-[10px] sm:pl-[195px]"><button className={btnPrimary}>Xuất Excel</button></div>
      </form>
    </LabPage>
  );
}
