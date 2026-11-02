import { LabPage, btnPrimary } from "@/components/m2/lab-ui/page";
import { DateRange, FilterRow } from "@/components/m2/manage/filter-row";

/** Sổ giao nhận thiết bị: chọn khoảng ngày, xuất sổ (các lần nhập / xuất kho kèm thiết bị). */
export default function InstrumentHandoverPage() {
  return (
    <LabPage title="Sổ giao nhận">
      <form action="/api/instrument-manage/handover">
        <FilterRow label="Từ ngày:" htmlFor="from"><DateRange /></FilterRow>
        <div className="py-[10px] sm:pl-[195px]"><button className={btnPrimary}>Xuất sổ giao nhận</button></div>
      </form>
    </LabPage>
  );
}
