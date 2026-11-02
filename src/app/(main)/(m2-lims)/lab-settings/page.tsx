import Link from "next/link";
import { LabPage } from "@/components/m2/lab-ui/page";

export const dynamic = "force-dynamic";

/** Danh mục cài đặt của phòng thí nghiệm – đúng thứ tự như XaLab; mục chưa có trang hiện chữ thường. */
const ITEMS: { label: string; href?: string }[] = [
  { label: "Bảng định mức", href: "/norm-lists" },
  { label: "Bảng giá", href: "/price-lists" },
  { label: "Bảo quản", href: "/preservations" },
  { label: "Biên bản thử nghiệm", href: "/test-records" },
  { label: "Công thức", href: "/lab-formulas" },
  { label: "Cột quy chuẩn", href: "/specifications" },
  { label: "Chỉ tiêu phân tích", href: "/lab-analytes" },
  { label: "Chỉ tiêu phụ", href: "/analyte-mappings" },
  { label: "Danh sách số phiếu kết quả", href: "/report-numbers" },
  { label: "Danh sách thiết bị", href: "/instrument-types" },
  { label: "Đặt lại mật khẩu", href: "/access-control" },
  { label: "Đơn vị hiệu chuẩn", href: "/calibration-units" },
  { label: "Hoá chất", href: "/chemicals" },
  { label: "Loại dụng cụ lấy mẫu", href: "/container-types" },
  { label: "Loại kế hoạch", href: "/event-types" },
  { label: "Loại mẫu", href: "/sample-types" },
  { label: "Mã thiết bị", href: "/equipment" },
  { label: "Mức ưu tiên của yêu cầu", href: "/request-priorities" },
  { label: "Ngành công nghiệp", href: "/industries" },
  { label: "Nhà cung cấp", href: "/suppliers" },
  { label: "Nhà sản xuất", href: "/manufacturers" },
  { label: "Nhân viên", href: "/lab-staff" },
  { label: "Nhóm chỉ tiêu Môi trường lao động", href: "/mtld-groups" },
  { label: "Nhóm chỉ tiêu phân tích", href: "/analyte-groups" },
  { label: "Nhóm dụng cụ lấy mẫu", href: "/sampling-containers" },
  { label: "Nhóm dụng cụ phân tích", href: "/lab-products" },
  { label: "Phòng ban/Chi nhánh", href: "/departments" },
  { label: "Phương pháp phân tích", href: "/lab-methods" },
  { label: "Quy chuẩn", href: "/standards" },
  { label: "Tài khoản Google lưu trữ tài liệu" },
  { label: "Template cho Bóc tách", href: "/bulk-templates" },
  { label: "Template mẻ thử nghiệm", href: "/batch-templates" },
  { label: "Thầu phụ", href: "/subcontractors" },
  { label: "Thông tin công ty", href: "/lab-infos" },
];

/** Hồ sơ chất lượng (ISO/IEC 17025) có dữ liệu riêng của Viện – XaLab không có, đặt tiếp sau các mục của XaLab. */
const QUALITY: { label: string; href: string }[] = [
  { label: "Đăng ký rủi ro", href: "/risks" },
  { label: "Dụng cụ – Vật tư", href: "/tools" },
  { label: "Kiểm soát tài liệu", href: "/documents" },
  { label: "Năng lực nhân sự", href: "/personnel" },
  { label: "Phạm vi công nhận VILAS", href: "/accreditation" },
  { label: "Phiếu yêu cầu thử nghiệm", href: "/test-requests" },
  { label: "QC Levey-Jennings", href: "/qc" },
  { label: "Quy tắc quyết định", href: "/decision-rules" },
  { label: "Sổ theo dõi mẫu lưu", href: "/archive" },
  { label: "Theo dõi điều kiện môi trường", href: "/environment" },
  { label: "Ý kiến & khiếu nại", href: "/feedback" },
];

const cell = "block border-b border-[#ddd] px-[15px] py-2.5 text-[14px] last:border-b-0";

/** Các mục chia 3 cột, đánh số liên tục từ `start`. */
function Columns({ items, start, perCol }: { items: { label: string; href?: string }[]; start: number; perCol: number }) {
  const cols = [items.slice(0, perCol), items.slice(perCol, perCol * 2), items.slice(perCol * 2)].filter((c) => c.length);
  return (
    <div className="grid gap-x-[30px] gap-y-4 md:grid-cols-3">
      {cols.map((col, c) => (
        <ul key={c} className="self-start rounded border border-[#ddd]">
          {col.map((it, i) => {
            const label = `${start + c * perCol + i}. ${it.label}`;
            return (
              <li key={it.label}>
                {it.href ? <Link href={it.href} className={`${cell} text-[#555] hover:bg-[#f5f5f5]`}>{label}</Link> : <span className={`${cell} text-[#999]`} title="Đang làm">{label}</span>}
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  );
}

export default function LabSettingsPage() {
  return (
    <LabPage title="Cài đặt" rule={false}>
      <Columns items={ITEMS} start={1} perCol={12} />
      <h2 className="mb-3 mt-8 text-xl font-medium text-[#333]">Hồ sơ chất lượng (ISO/IEC 17025)</h2>
      <Columns items={QUALITY} start={ITEMS.length + 1} perCol={4} />
    </LabPage>
  );
}
