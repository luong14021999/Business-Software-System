import Link from "next/link";
import { notFound } from "next/navigation";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { FileUpload } from "@/components/m2/settings/file-upload";
import { specById } from "@/lib/modules/m2/data/specs";
import { SPEC_ROW_COLUMNS } from "@/lib/modules/m2/spec-rows";

export const dynamic = "force-dynamic";

/** Nhập giới hạn chỉ tiêu của cột quy chuẩn từ file (như "Upload file Excel" của XaLab). */
export default async function SpecRowsImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await specById(id))) notFound();
  return (
    <LabPage title="Upload file Excel">
      <FileUpload url={`/api/specifications/${id}/rows`} doneHref={`/specifications/${id}`} />
      <p className="mt-4 text-sm text-[#555]">File CSV (trong Excel chọn Lưu thành → CSV UTF-8) với các cột: {SPEC_ROW_COLUMNS.join(", ")}. Dùng file Xuất Excel của cột quy chuẩn làm mẫu. Dòng không có giới hạn nào sẽ xóa giới hạn đang có của chỉ tiêu đó.</p>
      <div className="mt-4"><Link href={`/specifications/${id}`} className={btn}>Quay lại</Link></div>
    </LabPage>
  );
}
