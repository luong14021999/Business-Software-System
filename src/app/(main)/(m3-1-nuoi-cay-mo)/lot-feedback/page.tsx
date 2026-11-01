import { MessageSquare, Inbox, Star, HeartPulse } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { lotFeedbackStore, seedlingLotStore } from "@/lib/modules/m3/data/tissue";
import { FEEDBACK_CHANNELS, FEEDBACK_STATUSES } from "@/lib/modules/m3/production";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Phản hồi khách hàng" };

export default async function LotFeedbackPage() {
  const [all, lots, customers] = await Promise.all([lotFeedbackStore.list(), seedlingLotStore.list(), getCustomers()]);
  const lotById = byId(lots);
  const customerById = byId(customers);
  const fields: CrudField[] = [
    { name: "lotId", label: "Lô cây giống", type: "select", options: refOptions(lots, (l) => l.code) },
    { name: "customerId", label: "Khách hàng", type: "select", options: refOptions(customers, (c) => `${c.code} · ${c.name}`) },
    { name: "channel", label: "Kênh", type: "select", options: [...FEEDBACK_CHANNELS] },
    { name: "contactName", label: "Người phản hồi" },
    { name: "phone", label: "Điện thoại" },
    { name: "survivalPct", label: "Tỷ lệ sống khách báo (%)", type: "number" },
    { name: "rating", label: "Hài lòng (1–5)", type: "number" },
    { name: "content", label: "Nội dung phản hồi", type: "textarea", required: true },
    { name: "response", label: "Viện trả lời / xử lý", type: "textarea" },
    { name: "status", label: "Trạng thái", type: "select", options: [...FEEDBACK_STATUSES] },
    { name: "note", label: "Ghi chú nội bộ", type: "textarea" },
  ];
  const rated = all.filter((f) => f.rating > 0);
  const withSurvival = all.filter((f) => f.survivalPct > 0);

  return (
    <>
      <Header title="Phản hồi khách hàng" description="Phản hồi về lô cây giống – từ trang truy xuất QR hoặc cán bộ ghi nhận; theo dõi xử lý và hỗ trợ kỹ thuật" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Phản hồi", value: all.length, icon: MessageSquare, accent: "bg-blue-50 text-blue-600" },
            { label: "Chưa xử lý", value: all.filter((f) => f.status !== "Đã phản hồi").length, icon: Inbox, accent: "bg-rose-50 text-rose-600" },
            { label: "Hài lòng trung bình", value: rated.length ? `${(rated.reduce((s, f) => s + f.rating, 0) / rated.length).toFixed(1)} / 5` : "—", icon: Star, accent: "bg-amber-50 text-amber-600" },
            { label: "Tỷ lệ sống khách báo", value: withSurvival.length ? `${Math.round(withSurvival.reduce((s, f) => s + f.survivalPct, 0) / withSurvival.length)}%` : "—", icon: HeartPulse, accent: "bg-emerald-50 text-emerald-700", hint: "trung bình" },
          ]}
        />
        <CrudTableCard
          title="Danh sách phản hồi"
          description="Bấm Sửa để ghi nội dung trả lời và chuyển trạng thái"
          endpoint="/api/lot-feedback"
          entity="lot-feedback"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/lot-feedback" title="Ghi nhận phản hồi" fields={fields} addLabel="Ghi nhận" />}
          headers={["Thời điểm · kênh", "Lô · khách", "Đánh giá", "Nội dung", "Xử lý"]}
          emptyText="Chưa có phản hồi"
          rows={[...all].sort((a, b) => (b.receivedAt || "").localeCompare(a.receivedAt || "")).map((f) => ({
            id: f.id,
            label: f.contactName || f.channel,
            initial: f,
            cells: [
              <div key="t" className="text-xs whitespace-nowrap">{fmtDateTimeVN(f.receivedAt)}<div className="text-muted-foreground">{f.channel}</div></div>,
              <div key="l" className="text-xs"><span className="font-mono">{lotById.get(f.lotId)?.code ?? "—"}</span><div className="text-muted-foreground">{customerById.get(f.customerId)?.name ?? [f.contactName, f.phone].filter(Boolean).join(" · ")}</div></div>,
              <div key="r" className="text-xs whitespace-nowrap">{f.rating ? `${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}` : "—"}{f.survivalPct ? <div className="text-muted-foreground">sống {f.survivalPct}%</div> : null}</div>,
              <span key="c" className="text-sm whitespace-pre-line">{f.content}</span>,
              <div key="s" className="text-xs max-w-[240px]"><Badge variant={f.status === "Đã phản hồi" ? "success" : f.status === "Mới" ? "destructive" : "warning"}>{f.status}</Badge>{f.response && <div className="text-muted-foreground mt-0.5">{f.response}</div>}</div>,
            ],
          }))}
        />
      </main>
    </>
  );
}
