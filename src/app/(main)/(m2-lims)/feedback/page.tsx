import { feedbackStore } from "@/lib/modules/m2/data/feedback";
import { AddFeedbackDialog } from "@/components/m2/feedback/add-feedback-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { LabPage, table } from "@/components/m2/lab-ui/page";
import { XTabs } from "@/components/m2/lab-ui/x-tabs";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";

export const dynamic = "force-dynamic";

const ratingScore: Record<string, number> = {
  "Nhiệt tình": 4,
  Tốt: 4,
  Nhanh: 4,
  Khá: 3,
  "Đúng hạn": 3,
  "Hợp lý": 3,
  "Bình thường": 2,
  "Trung bình": 2,
  Cao: 2,
  Thấp: 2,
  Chậm: 1,
  Kém: 1,
};

/** Màu chữ theo mức đánh giá (4 = xanh lá … 1 = đỏ, như nhãn Bootstrap). */
const scoreColor = (v: string) => ["", "text-[#a94442]", "text-[#8a6d3b]", "text-[#31708f]", "text-[#3c763d]"][ratingScore[v] ?? 0] ?? "";

type ComplaintStatus = "Mới" | "Đang xử lý" | "Đã trả lời" | "Đã đóng";

const complaintColor: Record<ComplaintStatus, string> = {
  Mới: "font-bold text-[#a94442]",
  "Đang xử lý": "text-[#8a6d3b]",
  "Đã trả lời": "text-[#31708f]",
  "Đã đóng": "text-[#3c763d]",
};

const dimensions = [
  { key: "serviceAttitude" as const, label: "Thái độ phục vụ" },
  { key: "fee" as const, label: "Phí dịch vụ" },
  { key: "quality" as const, label: "Chất lượng thử nghiệm" },
  { key: "infoAvailability" as const, label: "Sẵn có thông tin" },
  { key: "deliveryTime" as const, label: "Thời hạn trả KQ" },
];

const FORM_ROWS = [
  { label: "Thái độ phục vụ", options: ["Nhiệt tình", "Tốt", "Bình thường", "Kém"] },
  { label: "Phí dịch vụ", options: ["Cao", "Hợp lý", "Thấp"] },
  { label: "Chất lượng thử nghiệm", options: ["Tốt", "Khá", "Trung bình", "Kém"] },
  { label: "Sự sẵn có thông tin của Viện", options: ["Tốt", "Khá", "Trung bình", "Kém"] },
  { label: "Thời hạn trả kết quả", options: ["Nhanh", "Đúng hạn", "Bình thường", "Chậm"] },
];

/** Phiếu thu thập ý kiến khách hàng (AEMD-BM-08.01) theo kiểu XaLab: tóm tắt, điểm 5 tiêu chí, danh sách theo tab, khiếu nại. */
export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ q?: string; tt?: string }> }) {
  const { q = "", tt = "" } = await searchParams;
  const all = await feedbackStore.list();
  const query = q.trim().toLowerCase();

  function avgRating(field: keyof (typeof all)[number]) {
    if (all.length === 0) return "0.0";
    const total = all.reduce((sum, f) => sum + (ratingScore[f[field] as string] ?? 0), 0);
    return (total / all.length).toFixed(1);
  }

  const complaints = all.filter((f) => f.isComplaint);
  const isPositive = (f: (typeof all)[number]) => !f.isComplaint && (ratingScore[f.quality] ?? 0) >= 3 && (ratingScore[f.serviceAttitude] ?? 0) >= 3;
  const positive = all.filter(isPositive);

  // Tab: tất cả / tích cực / khiếu nại / khiếu nại chưa trả lời (mới, đang xử lý).
  const TABS = [
    { key: "", label: "Tất cả", keep: () => true },
    { key: "tich-cuc", label: "Tích cực", keep: isPositive },
    { key: "khieu-nai", label: "Khiếu nại", keep: (f: (typeof all)[number]) => f.isComplaint },
    { key: "dang-xu-ly", label: "Đang xử lý", keep: (f: (typeof all)[number]) => f.isComplaint && (f.complaintStatus === "Mới" || f.complaintStatus === "Đang xử lý") },
  ];
  const tab = TABS.find((t) => t.key === tt) ?? TABS[0];
  const customerFeedbacks = all
    .filter(tab.keep)
    .filter((f) => !query || f.code.toLowerCase().includes(query) || (f.customerName ?? "").toLowerCase().includes(query) || (f.comments ?? "").toLowerCase().includes(query));
  const tabHref = (key: string) => {
    const p = new URLSearchParams(Object.entries({ q, tt: key }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/feedback${p.size ? `?${p}` : ""}`;
  };

  const stats = [
    { label: "Tổng phiếu ý kiến", value: all.length },
    { label: "Đánh giá tích cực", value: positive.length },
    { label: "Khiếu nại cần xử lý", value: complaints.filter((c) => c.complaintStatus !== "Đã đóng").length },
    { label: "Đã xử lý xong", value: complaints.filter((c) => c.complaintStatus === "Đã trả lời" || c.complaintStatus === "Đã đóng").length },
  ];

  return (
    <LabPage
      title="Phiếu thu thập ý kiến khách hàng"
      subtitle="Form AEMD-BM-08.01 · ISO/IEC 17025:2017 §7.9 (khiếu nại) + §8.6 (cải tiến)"
      toolbar={
        <>
          <EntitySearchInput basePath="/feedback" placeholder="Tìm mã, KH, nội dung..." />
          <AddFeedbackDialog />
        </>
      }
    >
      <table className={`${table} mb-6 sm:w-auto`}>
        <tbody>
          {stats.map((s) => (
            <tr key={s.label}>
              <td className="pr-8 font-bold">{s.label}</td>
              <td className="text-right">{s.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mb-1 text-xl font-medium">Điểm đánh giá trung bình theo 5 tiêu chí</h2>
      <p className="mb-3 text-sm text-[#777]">Quy đổi thang 4 điểm – nhằm theo dõi xu hướng hài lòng KH</p>
      <table className={`${table} mb-8`}>
        <thead>
          <tr>{dimensions.map((d) => <th key={d.key}>{d.label}</th>)}</tr>
        </thead>
        <tbody>
          <tr>
            {dimensions.map((d) => {
              const avg = parseFloat(avgRating(d.key));
              const color = avg >= 3.5 ? "text-[#3c763d]" : avg >= 2.5 ? "text-[#31708f]" : avg >= 1.5 ? "text-[#8a6d3b]" : "text-[#a94442]";
              return <td key={d.key}><span className={`text-xl font-bold ${color}`}>{avg}</span> <span className="text-[#777]">/ 4</span></td>;
            })}
          </tr>
        </tbody>
      </table>

      <h2 className="mb-1 text-xl font-medium">Danh sách phiếu ý kiến &amp; khiếu nại</h2>
      <p className="mb-3 text-sm text-[#777]">Phân loại theo tiêu chí – khiếu nại tự gắn cờ và vào quy trình xử lý</p>
      <XTabs tabs={TABS.map((t) => ({ label: t.label, href: tabHref(t.key) }))} active={tabHref(tab.key)} />
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th>Mã</th>
              <th>KH</th>
              <th>Thái độ</th>
              <th>Phí</th>
              <th>Chất lượng</th>
              <th>Thông tin</th>
              <th>Hạn KQ</th>
              <th>Ngày</th>
              <th>Khiếu nại</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customerFeedbacks.length === 0 && (
              <tr>
                <td colSpan={10} className="py-6 text-center text-muted-foreground">
                  {query ? `Không có phiếu nào khớp "${query}"` : "Chưa có phiếu nào"}
                </td>
              </tr>
            )}
            {customerFeedbacks.map((f) => (
              <tr key={f.id}>
                <td className="font-mono text-xs">{f.code}</td>
                <td>
                  {f.customerName ?? <span className="italic text-[#777]">Ẩn danh</span>}
                  {f.customerKind && <div className="text-xs text-[#777]">{f.customerKind}</div>}
                </td>
                {[f.serviceAttitude, f.fee, f.quality, f.infoAvailability, f.deliveryTime].map((v, i) => (
                  <td key={i} className={scoreColor(v)}>{v}</td>
                ))}
                <td className="whitespace-nowrap">{f.submittedAt}</td>
                <td className={f.isComplaint && f.complaintStatus ? complaintColor[f.complaintStatus as ComplaintStatus] : "text-[#777]"}>
                  {f.isComplaint && f.complaintStatus ? f.complaintStatus : "–"}
                </td>
                <td className="text-right"><XDeleteLink url={`/api/feedback/${f.id}`} label={f.code} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {complaints.length > 0 && (
        <>
          <h2 className="mb-1 mt-8 text-xl font-medium">Xử lý khiếu nại</h2>
          <p className="mb-3 text-sm text-[#777]">§7.9 ISO/IEC 17025:2017 – mỗi khiếu nại có vòng đời và người chịu trách nhiệm</p>
          <table className={table}>
            <thead>
              <tr><th>Mã</th><th>Khách hàng</th><th>Ngày</th><th>Trạng thái</th><th>Nội dung</th><th>Phản hồi</th></tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.code}</td>
                  <td>{c.customerName ?? "(Ẩn danh)"}</td>
                  <td className="whitespace-nowrap">{c.submittedAt}</td>
                  <td className={c.complaintStatus ? complaintColor[c.complaintStatus as ComplaintStatus] : ""}>{c.complaintStatus}</td>
                  <td className="italic">{c.comments ? <>&quot;{c.comments}&quot;</> : ""}</td>
                  <td>
                    {c.responseNote && (
                      <>
                        <b>{c.responder}</b>
                        {c.responseDate && <span className="text-[#777]"> ({c.responseDate})</span>}: {c.responseNote}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 className="mb-1 mt-8 text-xl font-medium">Mẫu phiếu thu thập ý kiến khách hàng</h2>
      <p className="mb-3 text-sm text-[#777]">AEMD-BM-08.01 · Lần ban hành 1 – mẫu chính thức của Viện</p>
      <div className="mx-auto max-w-2xl space-y-4 border border-[#ddd] p-5 text-sm">
        <div className="border-b border-[#ddd] pb-3 text-center">
          <div className="text-xs font-bold uppercase text-[#777]">Viện Nông nghiệp tỉnh Thanh Hóa · Phòng phân tích Đất, nước, phân bón và môi trường</div>
          <div className="mt-1 text-base font-bold">Phiếu thu thập ý kiến khách hàng</div>
          <div className="mt-0.5 font-mono text-[10px] text-[#777]">AEMD-BM-08.01</div>
        </div>
        <p className="text-xs leading-relaxed text-[#555]">
          Cảm ơn quý khách trong thời gian qua đã chọn dịch vụ của Viện Nông nghiệp Thanh Hóa. Để chúng tôi phục vụ quý khách tốt hơn trong thời gian tới, xin quý khách vui lòng nhận xét theo bảng sau (tích vào ô thích hợp):
        </p>
        <table className={table}>
          <tbody>
            {FORM_ROWS.map((row) => (
              <tr key={row.label}>
                <td className="font-bold">{row.label}</td>
                <td className="text-right">
                  {row.options.map((o) => <span key={o} className="ml-3 inline-flex items-center gap-1 text-xs"><span className="h-3.5 w-3.5 border border-[#999]" />{o}</span>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-1.5">
          <div className="text-xs font-bold">Các ý kiến đóng góp khác</div>
          <div className="h-16 border border-dashed border-[#ccc]" />
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><div className="text-[#777]">Tên khách hàng (nếu cần thiết)</div><div className="mt-1 h-6 border-b border-dashed border-[#ccc]" /></div>
          <div><div className="text-[#777]">Ngày góp ý kiến</div><div className="mt-1 h-6 border-b border-dashed border-[#ccc]" /></div>
        </div>
        <div className="pt-2 text-center text-xs italic text-[#777]">Trân trọng cảm ơn quý khách.</div>
      </div>
    </LabPage>
  );
}
