import { Search } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { LabPage, btn, input } from "@/components/m2/lab-ui/page";
import { CatalogTable } from "@/components/m2/lab-ui/catalog-table";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { DOC_STATUSES, DOC_TYPES, qmsDocumentStore, type QmsDocument } from "@/lib/modules/m2/data/qms";
import { currentAccess } from "@/lib/platform/data/access";
import { permissionForEntity } from "@/lib/platform/permissions";
import { daysUntil, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kiểm soát tài liệu" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã tài liệu", required: true, mono: true, placeholder: "VD: AEMD-QT-01" },
  { name: "docType", label: "Loại tài liệu", type: "select", options: [...DOC_TYPES] },
  { name: "title", label: "Tên tài liệu", required: true, full: true },
  { name: "version", label: "Lần ban hành / soát xét", placeholder: "VD: 03/2026" },
  { name: "status", label: "Trạng thái", type: "select", options: [...DOC_STATUSES] },
  { name: "issuedAt", label: "Ngày ban hành", type: "date" },
  { name: "reviewDue", label: "Hạn soát xét định kỳ", type: "date" },
  { name: "owner", label: "Người biên soạn / quản lý" },
  { name: "approvedBy", label: "Người phê duyệt" },
  { name: "distribution", label: "Nơi lưu / phân phối", full: true },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

/** Màu chữ trạng thái kiểu Bootstrap. */
const STATUS_COLOR: Record<QmsDocument["status"], string> = {
  "Hiệu lực": "text-[#3c763d]",
  "Dự thảo": "text-[#8a6d3b]",
  "Hết hiệu lực": "text-[#777]",
};

const REVIEW_WARN_DAYS = 60;

/** Kiểm soát tài liệu (ISO/IEC 17025 §8.3) kiểu XaLab: lọc loại tài liệu, tìm kiếm, bảng tài liệu thêm / sửa / xóa. */
export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q = "", type = "" } = await searchParams;
  const [list, access] = await Promise.all([qmsDocumentStore.list(), currentAccess()]);
  const canWrite = access.can(permissionForEntity("qms-documents"));
  const all = list.sort((a, b) => a.docType.localeCompare(b.docType) || a.code.localeCompare(b.code));
  const query = q.trim().toLowerCase();
  const docs = all.filter((d) => (!type || d.docType === type) && (!query || `${d.code} ${d.title} ${d.owner} ${d.approvedBy}`.toLowerCase().includes(query)));

  const active = all.filter((d) => d.status === "Hiệu lực");
  const reviewDue = active.filter((d) => daysUntil(d.reviewDue) <= REVIEW_WARN_DAYS);
  const href = (t: string) => `/documents?${new URLSearchParams({ ...(q && { q }), ...(t && { type: t }) })}`;

  return (
    <LabPage
      title="Kiểm soát tài liệu"
      rule={false}
      toolbar={
        <>
          <div className="flex">
            {canWrite && <EntityFormDialog mode="add" endpoint="/api/qms-documents" title="Thêm tài liệu" fields={FIELDS} trigger={<button type="button" className={`${btn} rounded-r-none`}>Thêm +</button>} />}
            <Dropdown
              filter
              className={`${btn} ${canWrite ? "-ml-px rounded-l-none" : ""}`}
              label={`Loại tài liệu: ${type || "Tất cả"}`}
              items={["", ...DOC_TYPES].map((t) => ({ label: `${t || "Tất cả"} (${t ? all.filter((d) => d.docType === t).length : all.length})`, href: href(t), active: type === t }))}
            />
          </div>
          <form action="/documents" className="flex">
            {type && <input type="hidden" name="type" value={type} />}
            <input name="q" defaultValue={q} placeholder="Tìm mã, tên, người duyệt…" aria-label="Tìm kiếm" className={`${input} !w-56 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
          </form>
        </>
      }
    >
      <p className="mb-3 text-sm text-[#555]">
        Tổng {all.length} tài liệu · đang hiệu lực {active.length} ·{" "}
        <span className={reviewDue.length ? "font-bold text-[#a94442]" : undefined}>cần soát xét {reviewDue.length}</span> (quá hạn hoặc ≤ {REVIEW_WARN_DAYS} ngày) · dự thảo chờ phê duyệt {all.filter((d) => d.status === "Dự thảo").length}.
        Tài liệu chỉ được dùng khi ở trạng thái Hiệu lực; tài liệu lỗi thời chuyển sang Hết hiệu lực.
      </p>
      <CatalogTable
        entity="qms-documents"
        canWrite={canWrite}
        fields={FIELDS}
        headers={["Mã", "Loại", "Tên tài liệu", "Phiên bản", "Ban hành", "Người phê duyệt", "Soát xét", "Trạng thái"]}
        emptyText={query || type ? "Không có tài liệu phù hợp" : "Chưa có tài liệu nào"}
        rows={docs.map((d) => {
          const days = daysUntil(d.reviewDue);
          const warn = d.status === "Hiệu lực" && days <= REVIEW_WARN_DAYS;
          return {
            id: d.id,
            label: d.code,
            initial: d,
            cells: [
              <span key="c" className="whitespace-nowrap font-bold">{d.code}</span>,
              d.docType,
              <div key="t" className="max-w-[360px]">
                {d.title}
                {d.distribution && <div className="text-xs text-[#777]">Lưu tại: {d.distribution}</div>}
              </div>,
              d.version,
              <span key="i" className="whitespace-nowrap">{fmtDateVN(d.issuedAt)}</span>,
              d.approvedBy,
              <span key="r" className={`whitespace-nowrap ${warn ? "font-bold text-[#a94442]" : ""}`}>
                {fmtDateVN(d.reviewDue)}
                {warn && <div className="text-xs">{days < 0 ? `quá hạn ${-days} ngày` : `còn ${days} ngày`}</div>}
              </span>,
              <span key="s" className={STATUS_COLOR[d.status] ?? "text-[#777]"}>{d.status}</span>,
            ],
          };
        })}
      />
    </LabPage>
  );
}
