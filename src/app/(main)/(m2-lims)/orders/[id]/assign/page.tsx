import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { AssignTable } from "@/components/m2/orders/assign-table";
import { analyteStore, orderLines, orderSampleStore, orderStore } from "@/lib/modules/m2/data/orders";
import { scopeOptions } from "@/lib/modules/m2/data/settings";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Phân công phân tích theo đơn hàng. */
export default async function OrderAssignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, samples, lines, staff, analytes, access] = await Promise.all([orderStore.list(), orderSampleStore.list(), orderLines(id), staffStore.list(), analyteStore.list(), currentAccess()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const assigned = lines.filter((l) => l.analyst || l.subcontractor).length;
  return (
    <LabPage
      title="Phân công phân tích"
      subtitle={`Đơn hàng ${order.code} · ${order.name} · đã phân công ${assigned}/${lines.length} chỉ tiêu`}
      wide
      toolbar={
        <>
          <Link href={`/orders/${id}/samples`} className={btn} aria-label="Quay lại danh sách yêu cầu"><ArrowLeft className="h-4 w-4" /></Link>
          <Link href={`/orders/${id}/plan`} className={btn}>Kế hoạch quan trắc</Link>
          <Link href={`/orders/${id}/results`} className={btn}>Nhập/duyệt kết quả</Link>
        </>
      }
    >
      <AssignTable
        orderId={id}
        samples={samples.filter((s) => s.orderId === id).sort((a, b) => a.code.localeCompare(b.code)).map((s) => ({ code: s.code, locationName: s.locationName, sampler: s.sampler }))}
        lines={lines}
        staff={staff.map((s) => s.fullName).filter(Boolean)}
        scopes={await scopeOptions()}
        methods={[...new Set(analytes.map((a) => a.method).filter(Boolean))].sort()}
        canWrite={access.can("work.assign")}
      />
    </LabPage>
  );
}
