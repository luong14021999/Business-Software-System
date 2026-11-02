import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { LabPage, Pager, btn, input, link, table } from "@/components/m2/lab-ui/page";
import { XTabs } from "@/components/m2/lab-ui/x-tabs";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { paginate } from "@/components/m2/lab-ui/x-list";
import { CHEMICAL_TABS } from "@/components/m2/manage/chemical-tabs";
import { chemicalExportStore, chemicalImportStore, chemicalLineCounts } from "@/lib/modules/m2/data/manage";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateVN } from "@/lib/platform/dates";
import { normalizeVi } from "@/lib/platform/format";

/** Danh sách lô nhập kho hoặc phiếu xuất kho hóa chất (tab Nhập kho / Xuất kho). */
export async function ChemList({ kind, sp }: { kind: "nhap" | "xuat"; sp: { q?: string; page?: string } }) {
  const [imports, exports, counts, access] = await Promise.all([chemicalImportStore.list(), chemicalExportStore.list(), chemicalLineCounts(kind), currentAccess()]);
  const items = (kind === "nhap"
    ? imports.map((x) => ({ id: x.id, date: x.importedAt, name: x.name, deliverer: x.deliverer, receiver: x.receiver, createdAt: x.createdAt }))
    : exports.map((x) => ({ id: x.id, date: x.exportedAt, name: "", deliverer: x.deliverer, receiver: x.receiver, createdAt: x.createdAt }))
  ).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const q = normalizeVi(sp.q ?? "");
  const rows = items.filter((x) => !q || normalizeVi(`${x.name} ${fmtDateVN(x.date)} ${x.deliverer} ${x.receiver}`).includes(q));
  const { page, pages, slice } = paginate(rows, sp);
  const canWrite = access.can("write.lab");
  const base = kind === "nhap" ? "/chemical-manage/imports" : "/chemical-manage/exports";
  const api = kind === "nhap" ? "/api/chemical-imports" : "/api/chemical-exports";
  return (
    <LabPage title={kind === "nhap" ? "Quản lý hóa chất nhập kho" : "Quản lý hóa chất xuất kho"}>
      <XTabs tabs={CHEMICAL_TABS} active={base} />
      <div className="flex flex-wrap items-center gap-1">
        {canWrite && <Link href={`${base}/new`} className={btn}>Thêm <Plus className="h-4 w-4 stroke-[3]" /></Link>}
        <form action={base} className="flex">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Từ khóa tìm kiếm..." aria-label="Tìm kiếm" className={`${input} !w-44 rounded-r-none`} />
          <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
        </form>
        <Link href={`/chemical-manage/stats/${kind === "nhap" ? "nhap-kho" : "su-dung"}`} className={btn}>{kind === "nhap" ? "Thống kê nhập kho hóa chất" : "Thống kê xuất kho hóa chất"}</Link>
      </div>
      <hr className="my-5 border-[#eee]" />
      <table className={table}>
        <thead><tr><th>#</th>{kind === "nhap" && <th>Lô hàng</th>}<th>Ngày {kind === "nhap" ? "nhập" : "xuất"} kho</th><th>Người giao</th><th>Người nhận</th><th>Số hóa chất</th><th /></tr></thead>
        <tbody>
          {slice.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>}
          {slice.map((x, i) => (
            <tr key={x.id}>
              <td>{(page - 1) * 10 + i + 1}</td>
              {kind === "nhap" && <td><Link href={`${base}/${x.id}`} className={link}>{x.name}</Link></td>}
              <td>{kind === "xuat" ? <Link href={`${base}/${x.id}`} className={link}>{fmtDateVN(x.date)}</Link> : fmtDateVN(x.date)}</td>
              <td>{x.deliverer}</td>
              <td>{x.receiver}</td>
              <td>{counts.get(x.id) ?? 0}</td>
              <td className="text-right">{canWrite && <XDeleteLink url={`${api}/${x.id}`} label={kind === "nhap" ? `lô ${x.name}` : `phiếu xuất ngày ${fmtDateVN(x.date)}`} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5"><Pager page={rows.length ? page : 0} pages={pages} href={(p) => `${base}?${sp.q ? `q=${encodeURIComponent(sp.q)}&` : ""}page=${p}`} /></div>
    </LabPage>
  );
}
