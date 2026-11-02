import Link from "next/link";
import { LabPage } from "@/components/m2/lab-ui/page";

export const dynamic = "force-dynamic";

/** Danh mục cài đặt của phòng thí nghiệm – đúng thứ tự như XaLab; mục chưa có trang hiện chữ thường. */
const ITEMS: { label: string; href?: string }[] = [
  { label: "Bảng định mức", href: "/norm-lists" },
  { label: "Bảng giá", href: "/price-lists" },
  { label: "Bảo quản", href: "/preservations" },
  { label: "Biên bản thử nghiệm" },
  { label: "Công thức", href: "/calculation-methods" },
  { label: "Cột quy chuẩn", href: "/specifications" },
  { label: "Chỉ tiêu phân tích", href: "/lab-analytes" },
  { label: "Chỉ tiêu phụ" },
  { label: "Danh sách số phiếu kết quả" },
  { label: "Danh sách thiết bị", href: "/instrument-types" },
  { label: "Đặt lại mật khẩu", href: "/access-control" },
  { label: "Đơn vị hiệu chuẩn" },
  { label: "Hoá chất", href: "/chemicals" },
  { label: "Loại dụng cụ lấy mẫu", href: "/container-types" },
  { label: "Loại kế hoạch" },
  { label: "Loại mẫu", href: "/sample-types" },
  { label: "Mã thiết bị", href: "/equipment" },
  { label: "Mức ưu tiên của yêu cầu" },
  { label: "Ngành công nghiệp" },
  { label: "Nhà cung cấp", href: "/suppliers" },
  { label: "Nhà sản xuất", href: "/manufacturers" },
  { label: "Nhân viên", href: "/personnel" },
  { label: "Nhóm chỉ tiêu Môi trường lao động", href: "/analyte-groups" },
  { label: "Nhóm chỉ tiêu phân tích", href: "/analyte-groups" },
  { label: "Nhóm dụng cụ lấy mẫu" },
  { label: "Nhóm dụng cụ phân tích", href: "/tools" },
  { label: "Phòng ban/Chi nhánh" },
  { label: "Phương pháp phân tích", href: "/lab-methods" },
  { label: "Quy chuẩn", href: "/specifications" },
  { label: "Tài khoản Google lưu trữ tài liệu" },
  { label: "Template cho Bóc tách", href: "/bulk-templates" },
  { label: "Template mẻ thử nghiệm", href: "/batch-templates" },
  { label: "Thầu phụ", href: "/subcontractors" },
  { label: "Thông tin công ty" },
];

export default function LabSettingsPage() {
  const cols = [ITEMS.slice(0, 12), ITEMS.slice(12, 24), ITEMS.slice(24)];
  const cell = "block border-b border-[#ddd] px-[15px] py-2.5 text-[14px] last:border-b-0";
  return (
    <LabPage title="Cài đặt" rule={false}>
      <div className="grid gap-x-[30px] gap-y-4 md:grid-cols-3">
        {cols.map((col, c) => (
          <ul key={c} className="self-start rounded border border-[#ddd]">
            {col.map((it, i) => {
              const label = `${c * 12 + i + 1}. ${it.label}`;
              return (
                <li key={it.label}>
                  {it.href ? <Link href={it.href} className={`${cell} text-[#555] hover:bg-[#f5f5f5]`}>{label}</Link> : <span className={`${cell} text-[#999]`} title="Đang làm">{label}</span>}
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </LabPage>
  );
}
