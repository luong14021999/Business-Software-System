import Link from "next/link";
import { Truck, BadgeCheck, CalendarClock, OctagonAlert } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_RESULTS,
  SUPPLIER_STATUSES,
  supplierStore,
  type Supplier,
} from "@/lib/modules/m2/data/competence";
import { daysUntil, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nhà cung cấp" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã nhà cung cấp", required: true, mono: true, placeholder: "VD: NCC-001" },
  { name: "category", label: "Nhóm", type: "select", options: [...SUPPLIER_CATEGORIES] },
  { name: "name", label: "Tên nhà cung cấp", required: true, full: true },
  { name: "provides", label: "Sản phẩm / dịch vụ cung cấp", type: "textarea" },
  { name: "contact", label: "Người liên hệ" },
  { name: "phone", label: "Điện thoại" },
  { name: "accreditation", label: "Năng lực / công nhận (VD: VILAS, VLAT, ISO 17034, ISO 17043…)", full: true },
  { name: "status", label: "Trạng thái", type: "select", options: [...SUPPLIER_STATUSES] },
  { name: "result", label: "Kết quả đánh giá", type: "select", options: ["", ...SUPPLIER_RESULTS] },
  { name: "evaluatedAt", label: "Ngày đánh giá", type: "date" },
  { name: "nextEvaluationAt", label: "Đánh giá lại", type: "date" },
  { name: "criteria", label: "Tiêu chí & nhận xét đánh giá (chất lượng, giao hàng, CoA, giá, hỗ trợ kỹ thuật…)", type: "textarea" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

const statusVariant: Record<Supplier["status"], "success" | "warning" | "secondary"> = {
  "Được phê duyệt": "success",
  "Đang đánh giá": "warning",
  "Ngừng sử dụng": "secondary",
};

const RE_EVAL_WARN_DAYS = 30;

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const { q = "", cat = "" } = await searchParams;
  const all = (await supplierStore.list()).sort((a, b) => a.code.localeCompare(b.code));
  const query = q.trim().toLowerCase();
  const rows = all.filter(
    (s) =>
      (!cat || s.category === cat) &&
      (!query || `${s.code} ${s.name} ${s.provides} ${s.contact}`.toLowerCase().includes(query)),
  );
  const inUse = all.filter((s) => s.status !== "Ngừng sử dụng");
  const reEval = inUse.filter((s) => daysUntil(s.nextEvaluationAt) <= RE_EVAL_WARN_DAYS);

  return (
    <>
      <Header
        title="Nhà cung cấp sản phẩm & dịch vụ"
        description="ISO/IEC 17025:2017 §6.6 – lựa chọn, đánh giá, phê duyệt và đánh giá lại nhà cung cấp hóa chất, vật tư, hiệu chuẩn, PT"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Nhà cung cấp", value: all.length, icon: Truck, accent: "bg-blue-50 text-blue-600" },
            { label: "Được phê duyệt", value: all.filter((s) => s.status === "Được phê duyệt").length, icon: BadgeCheck, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Cần đánh giá lại", value: reEval.length, icon: CalendarClock, accent: "bg-amber-50 text-amber-600", hint: `quá hạn hoặc ≤ ${RE_EVAL_WARN_DAYS} ngày` },
            { label: "Không đạt nhưng đang dùng", value: inUse.filter((s) => s.result === "Không đạt").length, icon: OctagonAlert, accent: "bg-rose-50 text-rose-600" },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          {["", ...SUPPLIER_CATEGORIES].map((c) => (
            <Link
              key={c || "all"}
              href={`/iso-suppliers?${new URLSearchParams({ ...(q && { q }), ...(c && { cat: c }) })}`}
              className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${
                cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
              }`}
            >
              {c || "Tất cả"} <span className="ml-1.5 opacity-70">{c ? all.filter((s) => s.category === c).length : all.length}</span>
            </Link>
          ))}
          <div className="ml-auto w-full sm:w-auto">
            <EntitySearchInput basePath="/iso-suppliers" placeholder="Tìm mã, tên, sản phẩm…" />
          </div>
        </div>

        <CrudTableCard
          title="Danh sách nhà cung cấp"
          description="Chỉ mua hàng / dịch vụ từ nhà cung cấp Được phê duyệt; đánh giá lại định kỳ"
          endpoint="/api/suppliers"
          entity="suppliers"
          editFields={FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/suppliers"
              title="Thêm nhà cung cấp"
              fields={FIELDS}
              addLabel="Thêm nhà cung cấp"
            />
          }
          headers={["Mã / nhóm", "Nhà cung cấp", "Năng lực / công nhận", "Đánh giá", "Đánh giá lại", "Trạng thái"]}
          emptyText={query || cat ? "Không có nhà cung cấp phù hợp" : "Chưa có nhà cung cấp nào"}
          rows={rows.map((s) => {
            const days = daysUntil(s.nextEvaluationAt);
            const due = s.status !== "Ngừng sử dụng" && days <= RE_EVAL_WARN_DAYS;
            return {
              id: s.id,
              label: s.name,
              initial: s,
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{s.code}</div>
                  <div className="text-[11px] text-muted-foreground">{s.category}</div>
                </div>,
                <div key="n" className="max-w-[300px]">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">{clip(s.provides || "—", 80)}</div>
                  {(s.contact || s.phone) && (
                    <div className="text-[11px] text-muted-foreground">{[s.contact, s.phone].filter(Boolean).join(" · ")}</div>
                  )}
                </div>,
                <span key="a" className="text-xs">{s.accreditation || "—"}</span>,
                <div key="e" className="text-xs">
                  {s.result ? (
                    <Badge variant={s.result === "Đạt" ? "success" : s.result === "Không đạt" ? "destructive" : "warning"}>{s.result}</Badge>
                  ) : (
                    "chưa đánh giá"
                  )}
                  <div className="text-muted-foreground mt-0.5">{fmtDateVN(s.evaluatedAt)}</div>
                </div>,
                <span key="r" className={`text-xs ${due ? "text-rose-600 font-medium" : ""}`}>
                  {fmtDateVN(s.nextEvaluationAt) || "—"}
                  {due && (days < 0 ? ` · quá ${-days} ngày` : ` · còn ${days} ngày`)}
                </span>,
                <Badge key="s" variant={statusVariant[s.status] ?? "secondary"}>{s.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
