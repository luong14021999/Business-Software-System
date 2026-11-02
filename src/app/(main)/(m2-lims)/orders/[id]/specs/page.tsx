import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LabPage, Pager, btn, link, table } from "@/components/m2/lab-ui/page";
import { ApplySpecsButton } from "@/components/m2/orders/type-spec-form";
import { orderSampleStore, orderStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";

export const dynamic = "force-dynamic";

/** Danh sách quy chuẩn theo loại mẫu của đơn hàng (các loại mẫu có trong đơn). */
export default async function OrderSpecsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orders, samples, types] = await Promise.all([orderStore.list(), orderSampleStore.list(), sampleTypeStore.list()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const rows = types.filter((t) => samples.some((s) => s.orderId === id && s.sampleTypeId === t.id)).sort((a, b) => a.sort - b.sort);
  return (
    <LabPage
      title="Danh sách quy chuẩn theo loại mẫu"
      subtitle={<span className="text-lg font-medium text-[#333]">{order.name}</span>}
      toolbar={
        <>
          <Link href="/orders" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
          <ApplySpecsButton orderId={id} />
        </>
      }
    >
      <table className={table}>
        <thead><tr><th>Tên</th><th>Tiền tố</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={2} className="py-6 text-center text-muted-foreground">Đơn hàng chưa có yêu cầu – bóc tách trước</td></tr>}
          {rows.map((t) => (
            <tr key={t.id}>
              <td><Link href={`/orders/${id}/specs/${t.id}`} className={link}>{t.name}</Link></td>
              <td>{t.prefix}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5"><Pager page={rows.length ? 1 : 0} pages={rows.length ? 1 : 0} href={() => `/orders/${id}/specs`} /></div>
    </LabPage>
  );
}
