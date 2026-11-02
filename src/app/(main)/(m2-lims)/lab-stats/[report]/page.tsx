import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LabPage, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { LAB_REPORTS, type LabReport } from "@/lib/modules/m2/data/lab-stats";
import { rateListStore, subcontractorStore } from "@/lib/modules/m2/data/settings";
import { analyteStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { orderFormData } from "@/lib/modules/m2/data/order-form-data";
import { pageGate } from "@/components/m2/lab-ui/page-gate";

export const dynamic = "force-dynamic";

const BANG: Partial<Record<LabReport, [string, string][]>> = {
  "ngay-quan-trac": [["don-hang", "Đơn hàng"], ["nhan-su", "Nhân sự"], ["loai-mau-qc", "Loại mẫu (gồm QA/QC & mẫu lặp)"], ["loai-mau", "Loại mẫu (không QA/QC & mẫu lặp)"]],
  "so-nhan-mau": [["so-nhan-mau", "Sổ nhận mẫu"], ["so-giao-mau", "Sổ giao mẫu"], ["ho-so", "Hồ sơ phân tích"]],
};
BANG["so-giao-mau"] = BANG["so-nhan-mau"];

const BUTTONS: Record<LabReport, [string, string][]> = {
  "ngay-quan-trac": [["thuc-te", "Excel thực tế"], ["danh-gia", "Excel đánh giá"]],
  "so-nhan-mau": [["thuc-te", "Excel thực tế"], ["danh-gia", "Excel đánh giá"], ["so-giao-nhan", "Sổ giao nhận mẫu"], ["so-giao-nhan-2", "Sổ giao nhận mẫu 2"]],
  "so-giao-mau": [["thuc-te", "Excel thực tế"], ["danh-gia", "Excel đánh giá"], ["so-giao-nhan", "Sổ giao nhận mẫu"], ["so-giao-nhan-2", "Sổ giao nhận mẫu 2"]],
  "thau-phu": [["thuc-te", "Excel thực tế"], ["danh-gia", "Excel đánh giá"], ["so-thau-phu", "Sổ theo dõi thầu phụ"]],
  "dinh-muc": [["", "Xuất Excel"]],
  "cong-no": [["", "Xuất Excel"]],
  "so-phieu": [["", "Xuất Excel"]],
};

/** Cột nhãn hẹp (col-sm-2) ở các trang ít bộ lọc, rộng (col-sm-3) ở các trang có Phòng ban / Khách hàng như XaLab. */
const NARROW: LabReport[] = ["dinh-muc", "thau-phu"];

/** Một dòng form ngang kiểu XaLab: nhãn đậm canh phải, ô nhập bên phải. */
function Row({ label, htmlFor, narrow, children }: { label?: string; htmlFor?: string; narrow?: boolean; children: ReactNode }) {
  return (
    <div className="mb-[15px] flex flex-wrap items-center gap-y-1">
      <label htmlFor={htmlFor} className={`w-full pr-[30px] text-sm font-bold sm:text-right ${narrow ? "sm:w-[195px]" : "sm:w-[293px]"}`}>{label}</label>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[30px] gap-y-2">{children}</div>
    </div>
  );
}

type Opt = { id: string; name: string };
const Select = ({ id, name, first, options, wide, defaultValue }: { id: string; name: string; first: string; options: Opt[]; wide?: boolean; defaultValue?: string }) => (
  <select id={id} name={name} defaultValue={defaultValue ?? ""} className={`${input} ${wide ? "sm:!w-[555px]" : "sm:!w-[262px]"}`}>
    <option value="">{first}</option>
    {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
  </select>
);

/** Trang thống kê như XaLab: form lọc + các nút xuất Excel (không hiện bảng trên trang). */
export default async function LabStatsPage({ params }: { params: Promise<{ report: string }> }) {
  const { report } = await params;
  if (!(report in LAB_REPORTS)) notFound();
  const key = report as LabReport;
  const denied = await pageGate(key === "cong-no" ? "view.finance" : "view.stats");
  if (denied) return denied;
  const [data, types, analytes, subs, lists] = await Promise.all([orderFormData(), sampleTypeStore.list(), analyteStore.list(), subcontractorStore.list(), rateListStore.list()]);
  const bang = BANG[key];
  const narrow = NARROW.includes(key);
  const date = (id: string, name: string) => <input id={id} name={name} type="date" className={`${input} sm:!w-[165px]`} />;
  const dateRow = (
    <Row narrow={narrow} label="Từ ngày:" htmlFor="from">
      {date("from", "from")}
      <span className="flex items-center gap-[30px]"><label htmlFor="to" className="text-sm font-bold">đến:</label>{date("to", "to")}</span>
    </Row>
  );
  const orderFilters = (
    <>
      <Row narrow={narrow} label="Phòng ban/chi nhánh:" htmlFor="dept"><Select id="dept" name="dept" first="Chọn phòng ban/chi nhánh" options={data.departments} /></Row>
      <Row narrow={narrow} label="Khách hàng:" htmlFor="customer"><Select id="customer" name="customer" first="- Chọn khách hàng -" options={data.customers} wide /></Row>
      <Row narrow={narrow} label="Đơn vị yêu cầu quan trắc:" htmlFor="unit"><Select id="unit" name="unit" first="- Chọn đơn vị -" options={data.requestingUnits} wide /></Row>
    </>
  );
  const names = [...new Set(analytes.map((a) => a.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  return (
    <LabPage title={LAB_REPORTS[key].title}>
      <form action={`/api/lab-stats/${key}`} method="get" className="pt-[5px]">
        {bang && (
          <Row narrow={narrow} label="Bảng thống kê:" htmlFor="bang">
            <select id="bang" name="bang" defaultValue={key === "so-giao-mau" ? "so-giao-mau" : bang[0][0]} className={`${input} sm:!w-[262px]`}>
              {bang.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Row>
        )}
        {key === "so-phieu" ? (
          <>
            <Row narrow={narrow} label="Năm báo cáo:" htmlFor="year"><input id="year" name="year" inputMode="numeric" defaultValue={new Date().getFullYear()} className={`${input} sm:!w-[165px]`} /></Row>
            <Row narrow={narrow}>
              <span className="flex gap-4 text-sm">
                <label className="inline-flex items-center gap-1"><input type="radio" name="gop" value="don-hang" defaultChecked />Gộp số phiếu theo đơn hàng</label>
                <label className="inline-flex items-center gap-1"><input type="radio" name="gop" value="khong" />Không gộp số phiếu</label>
              </span>
            </Row>
          </>
        ) : dateRow}
        {key === "dinh-muc" && (
          <>
            <Row narrow={narrow}>
              <span className="flex gap-4 text-sm font-bold">
                <label className="inline-flex items-center gap-1"><input type="radio" name="basis" value="quan-trac" defaultChecked />ngày quan trắc</label>
                <label className="inline-flex items-center gap-1"><input type="radio" name="basis" value="tra-ket-qua" />ngày trả kết quả</label>
              </span>
            </Row>
            <Row narrow={narrow} label="Bảng định mức:" htmlFor="list"><Select id="list" name="list" first="Chọn bảng định mức" options={lists.filter((l) => l.kind === "norm")} /></Row>
            <Row narrow={narrow} label="Giảm trừ (%):" htmlFor="giam"><input id="giam" name="giam" inputMode="numeric" className={`${input} sm:!w-[165px]`} /></Row>
          </>
        )}
        {(key === "ngay-quan-trac" || key === "so-nhan-mau" || key === "so-giao-mau" || key === "cong-no") && orderFilters}
        {key === "thau-phu" && (
          <Row narrow={narrow} label="Thầu phụ:" htmlFor="sub"><Select id="sub" name="sub" first="- Chọn thầu phụ -" options={subs.map((s) => ({ id: s.name, name: s.name }))} wide /></Row>
        )}
        {(key === "ngay-quan-trac" || key === "so-nhan-mau" || key === "so-giao-mau") && (
          <Row narrow={narrow} label="Loại mẫu:" htmlFor="type">
            <Select id="type" name="type" first="-Chọn loại mẫu-" options={types.map((t) => ({ id: t.id, name: t.name }))} />
            <span className="flex items-center gap-[30px]">
              <label htmlFor="criterion" className="text-sm font-bold">Chỉ tiêu:</label>
              <Select id="criterion" name="criterion" first="" options={names.map((n) => ({ id: n, name: n }))} />
            </span>
          </Row>
        )}
        <div className={`flex flex-wrap gap-1 ${narrow || bang ? "sm:pl-[195px]" : "sm:pl-[293px]"}`}>
          {BUTTONS[key].map(([v, l]) => (
            <button key={l} type="submit" name={v ? "kind" : undefined} value={v || undefined} className={btnPrimary}>{l}</button>
          ))}
        </div>
      </form>
    </LabPage>
  );
}
