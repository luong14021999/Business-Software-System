import Link from "next/link";
import { LabPage, btn, link } from "@/components/m2/lab-ui/page";
import { AnalyteImportForm } from "@/components/m2/settings/analyte-import-form";
import { ANALYTE_COLUMNS } from "@/lib/modules/m2/analyte-io";

const TEMPLATE_URL = "/api/lab-analytes/export?mau=1";

/** Nhập danh sách chỉ tiêu từ file (như "Upload file Excel" của XaLab). */
export default function AnalyteImportPage() {
  return (
    <LabPage title="Upload file Excel">
      <AnalyteImportForm />
      <p className="mt-4 text-sm text-[#555]">
        File CSV (trong Excel chọn Lưu thành → CSV UTF-8) với các cột: {ANALYTE_COLUMNS.join(", ")}. Chỉ tiêu trùng loại mẫu + tên thì cập nhật, chưa có thì thêm mới.{" "}
        <a href={TEMPLATE_URL} className={link}>Tải file mẫu</a>
      </p>
      <div className="mt-4"><Link href="/lab-analytes" className={btn}>Quay lại</Link></div>
    </LabPage>
  );
}
