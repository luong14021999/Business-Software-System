import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { OrderSamplesTable, type SampleRow } from "@/components/m2/orders/order-samples-table";
import type { CrudField } from "@/components/crud/entity-form-dialog";
import { orderLines, orderSampleStore, orderStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { SAMPLE_STAGES, specLabel } from "@/lib/modules/m2/orders";

export const dynamic = "force-dynamic";

export default async function OrderSamplesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ stage?: string }> }) {
  const { id } = await params;
  const { stage = "" } = await searchParams;
  const [orders, samples, specs, lines] = await Promise.all([orderStore.list(), orderSampleStore.list(), specificationStore.list(), orderLines(id)]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const specName = new Map(specs.map((s) => [s.id, specLabel(s)]));
  const mine = samples.filter((s) => s.orderId === id);
  const rows: SampleRow[] = mine
    .filter((s) => !stage || s.stage === stage)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((s) => {
      const ls = lines.filter((l) => l.sampleCode === s.code);
      return { ...s, specName: [specName.get(s.specId), specName.get(s.spec2Id)].filter(Boolean).join(" · "), lines: ls.length, entered: ls.filter((l) => Number.isFinite(l.mean) || l.prefix).length };
    });
  const editFields: CrudField[] = [
    { name: "locationName", label: "Vị trí / tên mẫu", required: true, full: true },
    { name: "customerSampleCode", label: "Mã mẫu của khách" },
    { name: "specId", label: "Cột quy chuẩn 1", type: "select", options: [{ value: "", label: "— Không so sánh —" }, ...specs.filter((s) => s.active).map((s) => ({ value: s.id, label: specLabel(s) }))] },
    { name: "spec2Id", label: "Cột quy chuẩn 2", type: "select", options: [{ value: "", label: "— Không —" }, ...specs.filter((s) => s.active).map((s) => ({ value: s.id, label: specLabel(s) }))] },
    { name: "receivedAt", label: "Ngày nhận mẫu", type: "date" },
    { name: "dueAt", label: "Hạn trả kết quả", type: "date" },
    { name: "disposeAt", label: "Ngày hủy mẫu", type: "date" },
    { name: "isQc", label: "Mẫu QA/QC", type: "bool", boolLabels: ["Có", "Không"] },
    { name: "isDuplicate", label: "Mẫu lặp", type: "bool", boolLabels: ["Có", "Không"] },
  ];
  const url = (s?: string) => `/orders/${id}/samples${s ? `?stage=${encodeURIComponent(s)}` : ""}`;
  return (
    <LabPage
      title={`Yêu cầu của đơn hàng ${order.name}`}
      subtitle={`Đơn hàng ${order.code} · ${mine.length} yêu cầu`}
      toolbar={
        <>
          <Link href={`/orders/${id}/split`} className={btn}>Bóc tách thêm <Plus className="h-4 w-4" /></Link>
          <Dropdown filter className={btn} label={`Trạng thái: ${stage || "Tất cả"}`} items={[{ label: "Tất cả", href: url(), active: !stage }, ...SAMPLE_STAGES.map((s) => ({ label: s, href: url(s), active: stage === s }))]} />
          <Link href={`/orders/${id}/assign`} className={btn}>Phân công</Link>
          <Link href={`/orders/${id}/results`} className={btn}>Nhập/duyệt kết quả</Link>
          <Link href={`/orders/${id}`} className={btn}>Thông tin đơn hàng</Link>
        </>
      }
    >
      <OrderSamplesTable orderId={id} rows={rows} editFields={editFields} />
    </LabPage>
  );
}
