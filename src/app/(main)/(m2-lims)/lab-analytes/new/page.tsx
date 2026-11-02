import { LabPage } from "@/components/m2/lab-ui/page";
import { XTabs } from "@/components/m2/lab-ui/x-tabs";
import { AnalyteInfo } from "@/components/m2/settings/analyte-info";
import { analyteStore, type LabAnalyte } from "@/lib/modules/m2/data/orders";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const EMPTY: Omit<LabAnalyte, "id"> = {
  sampleTypeId: "", name: "", groupName: "", unit: "", method: "", loq: "", scope: "VILAS", accreditedNo: null, sort: 0, active: true, unitPrice: 0,
  printName: "", abbreviation: "", isField: false, note: "", formulaCode: "", industry: "", spec1Id: "", spec2Id: "", decimals: null,
  englishName: "", samplingMethod: "", noKFactor: false, notInQuote: false, allocatedCost: false,
};

/** Thêm chỉ tiêu (hoặc Copy từ chỉ tiêu có sẵn: điền sẵn mọi trường, sửa rồi lưu thành chỉ tiêu mới). */
export default async function NewAnalytePage({ searchParams }: { searchParams: Promise<{ copy?: string }> }) {
  const { copy } = await searchParams;
  const [items, access] = await Promise.all([analyteStore.list(), currentAccess()]);
  const src = copy ? items.find((a) => a.id === copy) : undefined;
  const { id: _omit, ...from } = src ?? { id: "", ...EMPTY };
  void _omit;
  return (
    <LabPage title="Tạo mới" subtitle={<span className="text-lg text-[#333]">Thông tin chỉ tiêu phân tích</span>}>
      <XTabs tabs={[{ label: "Thông tin", href: "#" }]} active="#" />
      <AnalyteInfo analyte={from} canWrite={access.can("write.quality")} />
    </LabPage>
  );
}
