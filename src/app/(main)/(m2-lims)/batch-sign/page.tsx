import Link from "next/link";
import { LabPage, link, table } from "@/components/m2/lab-ui/page";
import { linesByOrder } from "@/lib/modules/m2/data/orders";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

/** Ký duyệt: đơn hàng có kết quả chờ bước QA/QC hoặc chờ phê duyệt (ký điện tử). */
export default async function BatchSignPage() {
  const access = await currentAccess();
  const canQa = access.can("results.qa");
  const canApprove = access.can("results.approve");
  if (!canQa && !canApprove) {
    return (
      <LabPage title="Ký duyệt">
        <p className="text-[#a94442]">Bạn không có quyền ký duyệt.</p>
      </LabPage>
    );
  }
  const [qa, manager] = await Promise.all([canQa ? linesByOrder(["Chờ QA/QC"]) : [], canApprove ? linesByOrder(["Chờ Trưởng phòng"]) : []]);
  const ids = [...new Set([...qa, ...manager].map((o) => o.id))];
  const rows = ids
    .map((id) => {
      const o = qa.find((x) => x.id === id) ?? manager.find((x) => x.id === id)!;
      return { ...o, qa: qa.find((x) => x.id === id)?.n ?? 0, manager: manager.find((x) => x.id === id)?.n ?? 0 };
    })
    .sort((a, b) => b.code.localeCompare(a.code, undefined, { numeric: true }));
  return (
    <LabPage title="Ký duyệt">
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr><th className="w-12">Mã</th><th>Tên đơn hàng</th><th className="text-right">Chờ QA/QC</th><th className="text-right">Chờ phê duyệt</th><th /></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Không có kết quả nào chờ ký duyệt</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.code}</td>
                <td><Link href={`/orders/${r.id}`} className={link}>{r.name}</Link></td>
                <td className="text-right">{r.qa || ""}</td>
                <td className="text-right">{r.manager || ""}</td>
                <td className="whitespace-nowrap text-right"><Link href={`/orders/${r.id}/results`} className={link}>Ký duyệt</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LabPage>
  );
}
