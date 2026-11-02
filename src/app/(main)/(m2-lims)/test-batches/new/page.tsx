import { XFormPage } from "@/components/m2/lab-ui/x-form-page";
import { analyteStore } from "@/lib/modules/m2/data/orders";
import { batchTemplateStore } from "@/lib/modules/m2/data/settings";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Tạo mẻ thử nghiệm: người phân tích, ngày bắt đầu / kết thúc, template (lấy sẵn phương pháp, thiết bị, hóa chất). */
export default async function NewBatchPage() {
  const [staff, templates, analytes, access] = await Promise.all([staffStore.list(), batchTemplateStore.list(), analyteStore.list(), currentAccess()]);
  const opt = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")).map((x) => ({ value: x, label: x }));
  return (
    <XFormPage
      title="Tạo mới"
      subtitle="Thông tin mẻ thử nghiệm"
      fields={[
        { name: "analyst", label: "Người phân tích", type: "select", options: opt(staff.map((s) => s.fullName)), empty: "-chọn nhân sự-" },
        { name: "startedAt", label: "Ngày bắt đầu", type: "date" },
        { name: "finishedAt", label: "Ngày kết thúc", type: "date" },
        { name: "templateId", label: "Template", type: "select", options: templates.map((t) => ({ value: t.id, label: t.name })), empty: "-chọn template-" },
        { name: "method", label: "Phương pháp", type: "select", options: opt(analytes.map((a) => a.method)), empty: "Theo template / chọn sau" },
      ]}
      initial={{}}
      endpoint="/api/test-batches"
      backHref="/test-batches"
      editBase="/test-batches"
      canWrite={access.can("results.enter")}
    />
  );
}
