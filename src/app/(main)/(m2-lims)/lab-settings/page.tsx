import Link from "next/link";
import { LabPage, link } from "@/components/m2/lab-ui/page";

export const dynamic = "force-dynamic";

/** Danh mục cài đặt của phòng thí nghiệm. */
const ITEMS: { label: string; href?: string; note?: string }[] = [
  { label: "Phương pháp phân tích", href: "/lab-methods" },
  { label: "Nhóm chỉ tiêu phân tích", href: "/analyte-groups" },
  { label: "Loại mẫu (tiền tố mã mẫu)", href: "/sample-types" },
  { label: "Chỉ tiêu phân tích", href: "/lab-analytes" },
  { label: "Quy chuẩn / cột quy chuẩn & giới hạn", href: "/specifications" },
  { label: "Phạm vi công nhận VILAS", href: "/accreditation" },
  { label: "Công thức tính", href: "/calculation-methods" },
  { label: "Quy tắc quyết định", href: "/decision-rules" },
  { label: "Nhân viên", href: "/personnel" },
  { label: "Loại thiết bị", href: "/instrument-types" },
  { label: "Nhà sản xuất", href: "/manufacturers" },
  { label: "Thiết bị phân tích / quan trắc", href: "/equipment" },
  { label: "Hóa chất", href: "/chemicals" },
  { label: "Nhà cung cấp", href: "/suppliers" },
  { label: "Danh mục dùng chung (đơn vị tính, loại khách hàng…)", href: "/master-data" },
  { label: "Bảng giá", href: "/price-lists" },
  { label: "Bảng định mức", href: "/norm-lists" },
  { label: "Template cho bóc tách", href: "/bulk-templates" },
  { label: "Template mẻ thử nghiệm", href: "/batch-templates" },
  { label: "Thầu phụ", href: "/subcontractors" },
  { label: "Loại dụng cụ lấy mẫu", href: "/container-types" },
  { label: "Bảo quản", href: "/preservations" },
];

export default function LabSettingsPage() {
  return (
    <LabPage title="Cài đặt">
      <ol className="space-y-1.5 text-[15px]">
        {ITEMS.map((it, i) => (
          <li key={it.label}>
            {i + 1}.{" "}
            {it.href ? <Link href={it.href} className={link}>{it.label}</Link> : <span className="text-muted-foreground">{it.label}</span>}
            {it.note && <span className="ml-2 text-xs text-muted-foreground">({it.note})</span>}
          </li>
        ))}
      </ol>
    </LabPage>
  );
}
