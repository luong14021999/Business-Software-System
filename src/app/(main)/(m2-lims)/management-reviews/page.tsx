import Link from "next/link";
import { Presentation, CalendarCheck, ListChecks, CalendarClock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { StatGrid, clip } from "@/components/common/stat-grid";
import {
  REVIEW_STATUSES,
  internalAuditStore,
  isOpenNc,
  latestDate,
  managementReviewStore,
  nonconformityStore,
  qmsDocumentStore,
  type ManagementReview,
} from "@/lib/modules/m2/data/qms";
import { feedbackStore } from "@/lib/modules/m2/data/feedback";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { samplesStore } from "@/lib/modules/m2/data/samples";
import { ptRoundStore, riskStore } from "@/lib/modules/m2/data/quality";
import { accreditedTests, labInfo } from "@/lib/modules/m2/accreditation";
import { managementReviewInputs } from "@/lib/modules/m2/iso17025";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Xem xét của lãnh đạo" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã cuộc họp", required: true, mono: true, placeholder: "VD: XXLD-2026" },
  { name: "status", label: "Trạng thái", type: "select", options: [...REVIEW_STATUSES] },
  { name: "meetingAt", label: "Ngày họp", type: "date" },
  { name: "period", label: "Kỳ xem xét", placeholder: "VD: 01/2026 – 12/2026" },
  { name: "chair", label: "Chủ trì", full: true },
  { name: "participants", label: "Thành phần tham dự", type: "textarea" },
  { name: "inputsNote", label: "Ghi chú bổ sung cho các đầu vào §8.9.2 (a, b, c… không tự tổng hợp được)", type: "textarea" },
  { name: "outputs", label: "Đầu ra §8.9.3 – kết luận về hiệu lực hệ thống, cải tiến, nguồn lực, nhu cầu thay đổi", type: "textarea" },
  { name: "actions", label: "Hành động, người phụ trách, thời hạn", type: "textarea" },
];

const statusVariant: Record<ManagementReview["status"], "default" | "warning" | "success"> = {
  "Kế hoạch": "default",
  "Đã họp": "warning",
  "Đã hoàn tất hành động": "success",
};

type InputRow = { key: string; label: string; value: string; href?: string; sample?: boolean };

export default async function ManagementReviewsPage() {
  const [reviews, docs, ncs, audits, feedback, staff, equipment, samples, risks, externalQCRounds] = await Promise.all([
    managementReviewStore.list(),
    qmsDocumentStore.list(),
    nonconformityStore.list(),
    internalAuditStore.list(),
    feedbackStore.list(),
    staffStore.list(),
    equipmentStore.list(),
    samplesStore.list(),
    riskStore.list(),
    ptRoundStore.list(),
  ]);
  reviews.sort((a, b) => (b.meetingAt || "").localeCompare(a.meetingAt || ""));

  const today = todayISO();
  const yearAgo = String(Number(today.slice(0, 4)) - 1) + today.slice(4);
  const inYear = (d?: string) => Boolean(d) && d! >= yearAgo && d! <= today;

  const held = reviews.filter((r) => r.status !== "Kế hoạch");
  const lastHeld = latestDate(held.map((r) => r.meetingAt));
  const daysSince = lastHeld ? -daysUntil(lastHeld) : NaN;
  const previous = held.find((r) => r.meetingAt === lastHeld);
  const nextPlanned = reviews
    .filter((r) => r.status === "Kế hoạch" && r.meetingAt >= today)
    .map((r) => r.meetingAt)
    .sort()[0];

  // ── Tự tổng hợp đầu vào §8.9.2 trong 12 tháng gần nhất ────────────
  const activeDocs = docs.filter((d) => d.status === "Hiệu lực");
  const docsToReview = activeDocs.filter((d) => daysUntil(d.reviewDue) <= 0).length;
  const auditsDone = audits.filter((a) => a.status === "Hoàn thành" && inYear(a.conductedAt));
  const auditFindings = ncs.filter((n) => n.source === "Đánh giá nội bộ" && inYear(n.detectedAt));
  const ncYear = ncs.filter((n) => inYear(n.detectedAt));
  const boa = ncs.filter((n) => n.source === "Đánh giá bên ngoài (BoA)" && inYear(n.detectedAt));
  const fbYear = feedback.filter((f) => inYear(f.submittedAt));
  const complaints = fbYear.filter((f) => f.isComplaint);
  const complaintsOpen = complaints.filter((f) => f.complaintStatus !== "Đã đóng").length;
  const effective = ncs.filter((n) => n.status === "Đã đóng" && inYear(n.closedAt) && n.effectiveness.trim()).length;
  const overdueCal = equipment.filter((e) => daysUntil(e.nextCalibration) < 0).length;
  const openRisks = risks.filter((r) => r.status === "Mở" || r.status === "Đang xử lý").length;
  const qcYear = externalQCRounds.filter((r) => inYear(r.closedAt));
  const trainings = staff.reduce(
    (n, s) => n + s.trainings.filter((t) => t.year === Number(today.slice(0, 4))).length,
    0,
  );

  const values: Record<string, Omit<InputRow, "key" | "label">> = {
    a: { value: "Ghi vào phần Ghi chú bổ sung của biên bản" },
    b: { value: "Ghi vào phần Ghi chú bổ sung của biên bản" },
    c: { value: `${activeDocs.length} tài liệu hiệu lực · ${docsToReview} quá hạn soát xét`, href: "/documents" },
    d: {
      value: previous
        ? `Lần trước ${fmtDateVN(previous.meetingAt)} (${previous.code}): ${previous.status}`
        : "Chưa có cuộc xem xét trước",
    },
    e: { value: `${auditsDone.length} cuộc đã hoàn thành · ${auditFindings.length} phát hiện`, href: "/internal-audits" },
    f: { value: `${ncYear.length} không phù hợp ghi nhận · ${ncs.filter(isOpenNc).length} đang mở`, href: "/nonconformities" },
    g: { value: `${boa.length} phát hiện từ đánh giá của BoA · hiệu lực công nhận đến ${fmtDateVN(labInfo.validTo)}`, href: "/accreditation" },
    h: { value: `${samples.length} mẫu trong hệ thống · phạm vi công nhận ${accreditedTests.length} phép thử`, href: "/samples" },
    i: { value: `${fbYear.length} phiếu ý kiến khách hàng`, href: "/feedback" },
    j: { value: `${complaints.length} khiếu nại · ${complaintsOpen} chưa đóng`, href: "/feedback" },
    k: { value: `${effective} hành động khắc phục đã đóng có đánh giá hiệu lực`, href: "/nonconformities" },
    l: { value: `${staff.length} nhân sự · ${equipment.length} thiết bị · ${overdueCal} thiết bị quá hạn hiệu chuẩn`, href: "/iso-equipment" },
    m: { value: `${risks.length} rủi ro đã nhận diện · ${openRisks} đang mở / đang xử lý`, href: "/risks" },
    n: { value: `${qcYear.length} vòng PT / so sánh liên phòng · ${qcYear.filter((r) => r.verdict !== "Đạt").length} không đạt/cảnh báo`, href: "/qc" },
    o: { value: `${trainings} lượt đào tạo trong năm ${today.slice(0, 4)}`, href: "/personnel" },
  };
  const inputs: InputRow[] = managementReviewInputs.map((i) => ({ ...i, ...values[i.key] }));

  return (
    <>
      <Header
        title="Xem xét của lãnh đạo"
        description="ISO/IEC 17025:2017 §8.9 – xem xét hệ thống quản lý định kỳ với đủ đầu vào bắt buộc, ghi nhận quyết định và hành động"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Đã họp", value: held.length, icon: Presentation, accent: "bg-emerald-50 text-emerald-700", hint: "tổng số cuộc" },
            {
              label: "Lần gần nhất",
              value: lastHeld ? fmtDateVN(lastHeld) : "—",
              icon: CalendarCheck,
              accent: !lastHeld || daysSince > 365 ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600",
              hint: !lastHeld ? "chưa có cuộc nào" : daysSince > 365 ? "quá 12 tháng – cần tổ chức" : `${daysSince} ngày trước`,
            },
            { label: "Kế hoạch sắp tới", value: nextPlanned ? fmtDateVN(nextPlanned) : "—", icon: CalendarClock, accent: "bg-amber-50 text-amber-600" },
            { label: "Đầu vào tự tổng hợp", value: `${inputs.filter((i) => i.href).length}/15`, icon: ListChecks, accent: "bg-violet-50 text-violet-600", hint: "từ dữ liệu phần mềm" },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Đầu vào cho cuộc xem xét (§8.9.2)</CardTitle>
            <CardDescription>
              Số liệu 12 tháng gần nhất ({fmtDateVN(yearAgo)} – {fmtDateVN(today)}), tự tổng hợp từ phần mềm – dùng làm báo cáo đầu vào cho cuộc họp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border divide-y">
              {inputs.map((i) => (
                <div key={i.key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-2.5 text-sm">
                  <div className="sm:w-[42%] flex gap-2">
                    <span className="font-mono text-xs text-muted-foreground w-4 shrink-0 mt-0.5">{i.key})</span>
                    <span className="font-medium">{i.label}</span>
                  </div>
                  <div className="flex-1 flex flex-wrap items-center gap-2 pl-6 sm:pl-0">
                    {i.href ? (
                      <Link href={i.href} className="text-primary hover:underline">{i.value}</Link>
                    ) : (
                      <span className="text-muted-foreground italic">{i.value}</span>
                    )}
                    {i.sample && (
                      <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                        dữ liệu mẫu – chưa lưu DB
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <CrudTableCard
          title="Biên bản xem xét của lãnh đạo"
          description="Tổ chức ít nhất 1 lần/năm; ghi đầu ra §8.9.3 và hành động có người phụ trách, thời hạn"
          endpoint="/api/management-reviews"
          entity="management-reviews"
          editFields={FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/management-reviews"
              title="Thêm cuộc xem xét của lãnh đạo"
              fields={FIELDS}
              addLabel="Thêm cuộc họp"
            />
          }
          headers={["Mã / ngày họp", "Kỳ / chủ trì", "Đầu ra & quyết định", "Hành động", "Trạng thái"]}
          emptyText="Chưa có cuộc xem xét của lãnh đạo nào"
          rows={reviews.map((r) => ({
            id: r.id,
            label: r.code,
            initial: r,
            cells: [
              <div key="c">
                <div className="font-mono text-xs font-semibold">{r.code}</div>
                <div className="text-[11px] text-muted-foreground">{fmtDateVN(r.meetingAt) || "—"}</div>
              </div>,
              <div key="p" className="text-xs">
                <div>{r.period || "—"}</div>
                <div className="text-muted-foreground">{r.chair}</div>
              </div>,
              <div key="o" className="text-sm max-w-[300px] leading-snug">{clip(r.outputs || "—")}</div>,
              <div key="a" className="text-sm max-w-[260px] leading-snug">{clip(r.actions || "—")}</div>,
              <Badge key="s" variant={statusVariant[r.status] ?? "secondary"}>{r.status}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
