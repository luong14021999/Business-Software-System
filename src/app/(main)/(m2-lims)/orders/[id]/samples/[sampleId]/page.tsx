import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, btn } from "@/components/m2/lab-ui/page";
import { SampleFieldForm, SampleInfoForm, SampleLines, SampleSpecForm } from "@/components/m2/orders/sample-detail";
import { analyteStore, orderLines, orderSampleStore, orderStore, specificationStore } from "@/lib/modules/m2/data/orders";
import { planOf, pointStore } from "@/lib/modules/m2/data/order-extras";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { specLabel } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { canTouchOrder } from "@/lib/modules/m2/data/order-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "thong-tin", label: "Thông tin" },
  { key: "quy-chuan", label: "Quy chuẩn" },
  { key: "chi-tieu", label: "Chỉ tiêu" },
  { key: "nguoi-lay-mau", label: "Người lấy mẫu" },
] as const;

/** Chi tiết một yêu cầu (mẫu) của đơn hàng theo từng tab. */
export default async function SampleDetailPage({ params, searchParams }: { params: Promise<{ id: string; sampleId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id, sampleId }, { tab = "thong-tin" }] = await Promise.all([params, searchParams]);
  const [orders, samples, access] = await Promise.all([orderStore.list(), orderSampleStore.list(), currentAccess()]);
  const order = orders.find((o) => o.id === id);
  const sample = samples.find((s) => s.id === sampleId && s.orderId === id);
  if (!order || !sample) notFound();
  const canWrite = access.can("write.reception");
  // NV lấy mẫu sửa được tab "Người lấy mẫu" của đơn mình đi quan trắc.
  const canField = canWrite || (access.can("write.field") && (await canTouchOrder(id, "field")));
  const active = TABS.find((t) => t.key === tab)?.key ?? "thong-tin";
  const points = (await pointStore.list()).filter((p) => (order.locationId ? p.locationId === order.locationId : p.id === sample.pointId));

  let body: React.ReactNode;
  if (active === "thong-tin") {
    body = <SampleInfoForm sample={sample} points={points} canWrite={canWrite} />;
  } else if (active === "quy-chuan") {
    const specs = await specificationStore.list();
    const usable = specs.filter((s) => s.active && (!s.sampleTypeId || s.sampleTypeId === sample.sampleTypeId));
    body = <SampleSpecForm sample={sample} specs={usable.map((s) => ({ value: s.id, label: specLabel(s) }))} canWrite={canWrite} />;
  } else if (active === "chi-tieu") {
    const [lines, analytes] = await Promise.all([orderLines(id), analyteStore.list()]);
    body = (
      <SampleLines
        sampleId={sample.id}
        canWrite={canWrite}
        lines={lines.filter((l) => l.sampleCode === sample.code)}
        analytes={analytes
          .filter((a) => a.active && a.sampleTypeId === sample.sampleTypeId)
          .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
          .map((a) => ({ name: a.name, unit: a.unit, method: a.method, isField: a.isField, group: a.groupName }))}
      />
    );
  } else {
    const [staff, plan] = await Promise.all([staffStore.list(), planOf(id)]);
    const team = plan ? [plan.leader, plan.supervisor, plan.deputy1, plan.deputy2, ...plan.groups.flat()].filter(Boolean) : order.fieldStaff ? [order.fieldStaff] : [];
    body = (
      <SampleFieldForm
        sample={sample}
        staff={staff.map((s) => s.fullName).filter(Boolean)}
        team={[...new Set(team)]}
        point={points.find((p) => p.id === sample.pointId) ?? null}
        canWrite={canField}
      />
    );
  }

  return (
    <LabPage
      title={`Yêu cầu ${sample.code}`}
      subtitle={`${sample.locationName} · ${sample.type} · Đơn hàng ${order.code} – ${order.name} · ${sample.stage || "—"}`}
      toolbar={
        <>
          <Link href={`/orders/${id}/samples`} className={btn} aria-label="Quay lại danh sách yêu cầu"><ArrowLeft className="h-4 w-4" /></Link>
          <Link href={`/orders/${id}/results#${sample.code}`} className={btn}>Nhập/duyệt kết quả</Link>
          <Link href={`/orders/${id}/assign`} className={btn}>Phân công</Link>
        </>
      }
    >
      <div role="tablist" className="mb-4 flex flex-wrap border-b border-[#ddd]">
        {TABS.map((t) => (
          <Link key={t.key} role="tab" aria-selected={active === t.key} href={`/orders/${id}/samples/${sampleId}?tab=${t.key}`} className={cn("-mb-px rounded-t border px-4 py-2 text-sm", active === t.key ? "border-[#ddd] border-b-white bg-white text-[#555]" : "border-transparent text-[#337ab7] hover:bg-[#eee]")}>
            {t.label}
          </Link>
        ))}
      </div>
      {body}
    </LabPage>
  );
}
