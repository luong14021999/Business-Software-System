import { LabPage } from "@/components/m2/lab-ui/page";
import { XForm } from "@/components/m2/lab-ui/x-form";
import { resolveFields, type XField } from "@/lib/modules/m2/catalog-registry";

/** Trang Thêm / Sửa kiểu XaLab: tiêu đề, dòng "Thông tin …", form ngang với [←][Lưu & thoát][Lưu]. */
export async function XFormPage({
  title,
  subtitle,
  fields,
  initial,
  endpoint,
  id,
  backHref,
  editBase,
  extra,
  canWrite,
  children,
}: {
  title: string;
  subtitle: string;
  fields: XField[];
  initial: Record<string, unknown>;
  endpoint: string;
  id?: string;
  backHref: string;
  editBase?: string;
  extra?: Record<string, unknown>;
  canWrite: boolean;
  children?: React.ReactNode;
}) {
  return (
    <LabPage title={title} subtitle={<span className="text-lg text-[#333]">{subtitle}</span>}>
      <XForm fields={await resolveFields(fields)} initial={initial} endpoint={endpoint} id={id} backHref={backHref} editBase={editBase} extra={extra} canWrite={canWrite} />
      {children}
    </LabPage>
  );
}
