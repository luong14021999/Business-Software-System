import Link from "next/link";
import { List, Plus, Search } from "lucide-react";
import { LabPage, btn, btnXs, input, link, table } from "@/components/m2/lab-ui/page";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { EntityFormDialog } from "@/components/crud/entity-form-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { batchFields } from "@/components/m2/batches/batch-fields";
import { analyteStore, batchProgress, testBatchStore } from "@/lib/modules/m2/data/orders";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { BATCH_STATUSES } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateTimeVN } from "@/lib/platform/dates";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

export default async function TestBatchesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const [batches, progress, analytes, staff, equipment, access] = await Promise.all([testBatchStore.list(), batchProgress(), analyteStore.list(), staffStore.list(), equipmentStore.list(), currentAccess()]);
  const canWrite = access.can("results.enter");
  const fields = batchFields({ methods: [...new Set(analytes.map((a) => a.method).filter(Boolean))].sort(), staff: staff.map((s) => s.fullName), equipment });
  const q = normalizeVi(sp.q ?? "");
  const rows = batches
    .filter((b) => !sp.status || b.status === sp.status)
    .filter((b) => !q || normalizeVi(`${b.code} ${b.method} ${b.analyst}`).includes(q))
    .sort((a, b) => b.code.localeCompare(a.code));
  const url = (status?: string) => `/test-batches${status ? `?status=${encodeURIComponent(status)}` : ""}`;
  return (
    <LabPage
      title="Danh sách mẻ thử nghiệm"
      subtitle="Gom các mẫu cùng phương pháp phân tích trong một lần chạy: người phân tích, thiết bị, hóa chất, nhập kết quả cả mẻ"
      toolbar={
        <>
          {canWrite && <EntityFormDialog mode="add" endpoint="/api/test-batches" title="Thêm mẻ thử nghiệm" fields={fields} trigger={<button type="button" className={btn}>Thêm <Plus className="h-4 w-4" /></button>} />}
          <Dropdown filter className={btn} label={`Trạng thái: ${sp.status || "Tất cả"}`} items={[{ label: "Tất cả", href: url(), active: !sp.status }, ...BATCH_STATUSES.map((s) => ({ label: s, href: url(s), active: sp.status === s }))]} />
          <form action="/test-batches" className="flex">
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Mã mẻ, phương pháp, người phân tích" className={`${input} w-72 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4" /></button>
          </form>
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr><th>Mã</th><th>Phương pháp</th><th>Người phân tích</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Kết quả</th><th>Trạng thái</th><th /></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Chưa có mẻ thử nghiệm</td></tr>}
            {rows.map((b) => {
              const p = progress.get(b.id) ?? { lines: 0, approved: 0 };
              return (
                <tr key={b.id}>
                  <td className="whitespace-nowrap"><Link href={`/test-batches/${b.id}`} className={link}>{b.code}</Link></td>
                  <td>{b.method || "—"}</td>
                  <td>{b.analyst || "—"}</td>
                  <td className="whitespace-nowrap">{fmtDateTimeVN(b.startedAt)}</td>
                  <td className="whitespace-nowrap">{fmtDateTimeVN(b.finishedAt)}</td>
                  <td className="whitespace-nowrap">{p.approved}/{p.lines} đã duyệt</td>
                  <td className={b.status === "Trả kết quả" ? "text-[#337ab7]" : b.status === "Duyệt" ? "text-[#3c763d]" : "text-teal-700"}>{b.status}</td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Dropdown
                        className={btnXs}
                        label="Chức năng"
                        icon={<List className="h-3 w-3" aria-hidden />}
                        align="right"
                        items={[
                          { label: "Danh sách mã mẫu", href: `/test-batches/${b.id}` },
                          { label: "Nhập/duyệt kết quả", href: `/test-batches/${b.id}/results` },
                        ]}
                      />
                      {canWrite && <EntityFormDialog mode="edit" endpoint="/api/test-batches" id={b.id} title={`Sửa mẻ ${b.code}`} fields={batchFields({ methods: [...new Set(analytes.map((a) => a.method).filter(Boolean))].sort(), staff: staff.map((s) => s.fullName), equipment, edit: true })} initial={{ ...b, startedAt: b.startedAt.slice(0, 10), finishedAt: b.finishedAt.slice(0, 10) }} trigger={<button type="button" className={btnXs}>Sửa</button>} />}
                      {canWrite && <DeleteEntityButton entity="test-batches" id={b.id} label={`mẻ ${b.code}`} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </LabPage>
  );
}
