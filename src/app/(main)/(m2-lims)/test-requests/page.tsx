import { Search } from "lucide-react";
import { LabPage, btn, input, table } from "@/components/m2/lab-ui/page";
import { XTabs } from "@/components/m2/lab-ui/x-tabs";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import {
  type TestRequest,
  type TestRequestStatus,
} from "@/lib/mock-data";
import { testRequestsStore } from "@/lib/modules/m2/data/test-requests";
import { AddTestRequestDialog } from "@/components/m2/test-requests/add-test-request-dialog";

export const dynamic = "force-dynamic";

/** Màu chữ trạng thái kiểu Bootstrap. */
const statusColor: Record<TestRequestStatus, string> = {
  "Yêu cầu mới": "text-[#31708f]",
  "Đã báo giá": "text-[#8a6d3b]",
  "KH chấp nhận": "text-[#333]",
  "Đã ký HĐ": "text-[#3c763d]",
  "Đã nhận mẫu": "text-[#777]",
  "Đã hủy": "text-[#a94442]",
};

function totalOf(r: TestRequest) {
  const subtotal =
    r.criteria.reduce((s, c) => s + c.unitPrice, 0) * r.expectedSamples;
  const vat = subtotal * (r.vatRate / 100);
  return { subtotal, vat, total: subtotal + vat };
}

const formatCurrency = (v: number) =>
  v.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

const pipelineStages: TestRequestStatus[] = ["Yêu cầu mới", "Đã báo giá", "KH chấp nhận", "Đã ký HĐ", "Đã nhận mẫu"];

/** Tab lọc theo trạng thái (query string ?tab=). */
const TABS: { key: string; label: string; status?: TestRequestStatus }[] = [
  { key: "", label: "Tất cả" },
  { key: "new", label: "Yêu cầu mới", status: "Yêu cầu mới" },
  { key: "quoted", label: "Đã báo giá", status: "Đã báo giá" },
  { key: "signed", label: "Đã ký HĐ", status: "Đã ký HĐ" },
];

/** Phiếu yêu cầu thử nghiệm theo kiểu XaLab: tóm tắt theo giai đoạn, danh sách (lọc tab, tìm kiếm), phiếu mẫu kèm báo giá. */
export default async function TestRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { q = "", tab = "" } = await searchParams;
  const all = await testRequestsStore.list();
  const query = q.trim().toLowerCase();
  const tabStatus = TABS.find((t) => t.key === tab)?.status;
  const testRequests = all
    .filter((r) => !tabStatus || r.status === tabStatus)
    .filter(
      (r) =>
        !query ||
        r.code.toLowerCase().includes(query) ||
        r.customer.toLowerCase().includes(query) ||
        r.matrix.toLowerCase().includes(query) ||
        r.contact.toLowerCase().includes(query),
    );

  const counts = all.reduce<Record<TestRequestStatus, number>>(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {
      "Yêu cầu mới": 0,
      "Đã báo giá": 0,
      "KH chấp nhận": 0,
      "Đã ký HĐ": 0,
      "Đã nhận mẫu": 0,
      "Đã hủy": 0,
    },
  );

  const totalValue = all
    .filter((r) => r.status !== "Đã hủy")
    .reduce((sum, r) => sum + totalOf(r).total, 0);

  const stats = [
    { label: "Yêu cầu đang xử lý", value: counts["Yêu cầu mới"] + counts["Đã báo giá"] + counts["KH chấp nhận"] },
    { label: "Đã ký HĐ trong quý", value: counts["Đã ký HĐ"] },
    { label: "Đã chuyển thành mẫu", value: counts["Đã nhận mẫu"] },
    { label: "Giá trị HĐ dự kiến", value: `${formatCurrency(totalValue / 1_000_000)} triệu đ` },
  ];

  const demoRequest = all.find((r) => r.code.endsWith("00124")) ?? all[0];
  const demoTotals = demoRequest
    ? totalOf(demoRequest)
    : { subtotal: 0, vat: 0, total: 0 };
  const tabHref = (key: string) => {
    const p = new URLSearchParams(Object.entries({ q, tab: key }).filter(([, v]) => v));
    return `/test-requests${p.size ? `?${p}` : ""}`;
  };

  return (
    <LabPage
      title="Phiếu yêu cầu thử nghiệm"
      subtitle={<span className="text-lg text-[#333]">KH yêu cầu → Viện báo giá → KH chấp nhận → Ký hợp đồng → Nhận mẫu vào PTN</span>}
      toolbar={
        <>
          <AddTestRequestDialog />
          <form action="/test-requests" className="flex">
            {tab && <input type="hidden" name="tab" value={tab} />}
            <input name="q" defaultValue={q} placeholder="Tìm mã, khách hàng..." aria-label="Tìm yêu cầu" className={`${input} !w-52 rounded-r-none`} />
            <button className={`${btn} rounded-l-none border-l-0`} aria-label="Tìm"><Search className="h-4 w-4 stroke-[3]" /></button>
          </form>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <table className={table}>
          <tbody>
            {stats.map((s) => <tr key={s.label}><td>{s.label}</td><td className="text-right font-bold">{s.value}</td></tr>)}
          </tbody>
        </table>
        <table className={table}>
          <thead><tr><th>Bước</th><th>Giai đoạn</th><th className="text-right">Số yêu cầu</th></tr></thead>
          <tbody>
            {pipelineStages.map((s, i) => <tr key={s}><td>{i + 1}</td><td>{s}</td><td className="text-right font-bold">{counts[s]}</td></tr>)}
          </tbody>
        </table>
      </div>

      <h3 className="mb-1 mt-8 text-xl text-[#333]">Danh sách yêu cầu thử nghiệm</h3>
      <p className="mb-3 text-sm text-[#777]">Tổng {testRequests.length} yêu cầu · giá trị HĐ dự kiến {formatCurrency(totalValue / 1_000_000)} triệu VND</p>
      <XTabs tabs={TABS.map((t) => ({ label: t.label, href: tabHref(t.key) }))} active={tabHref(tab)} />
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th>Mã YC</th><th>Khách hàng</th><th>Matrix</th><th className="text-right">Mẫu × Chỉ tiêu</th><th className="text-right">Giá trị (VND)</th><th>Hạn KH</th><th>Trạng thái</th><th />
            </tr>
          </thead>
          <tbody>
            {testRequests.length === 0 && (
              <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">{query ? `Không có yêu cầu nào khớp "${query}"` : "Chưa có yêu cầu nào"}</td></tr>
            )}
            {testRequests.map((r) => {
              const total = totalOf(r);
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">
                    {r.code}
                    {r.contractCode && <div className="text-xs text-[#777]">{r.contractCode}</div>}
                  </td>
                  <td>
                    {r.customer}
                    <div className="text-xs text-[#777]">{r.contact} · {r.phone}</div>
                  </td>
                  <td>{r.matrix}</td>
                  <td className="text-right">
                    {r.expectedSamples} × {r.criteria.length}
                    <div className="text-xs text-[#777]">= {r.expectedSamples * r.criteria.length} dòng</div>
                  </td>
                  <td className="text-right">
                    {formatCurrency(total.total)}
                    {r.vatRate > 0 && <div className="text-xs text-[#777]">(VAT {r.vatRate}%)</div>}
                  </td>
                  <td>
                    {r.expectedDeliveryDays} ngày
                    <div className="text-xs text-[#777]">tạo {r.createdAt.slice(0, 10)}</div>
                  </td>
                  <td className={statusColor[r.status]}>{r.status}</td>
                  <td className="text-right"><XDeleteLink url={`/api/test-requests/${r.id}`} label={r.code} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {demoRequest && (
        <>
          <h3 className="mb-1 mt-8 text-xl text-[#333]">Phiếu yêu cầu thử nghiệm mẫu</h3>
          <p className="mb-3 text-sm text-[#777]">Mẫu phiếu KH gửi đến Viện – báo giá từ catalog chỉ tiêu và quy tắc quyết định đã phê duyệt</p>
          <div className="max-w-3xl rounded border border-[#ddd] p-[15px]">
            <div className="flex items-start justify-between border-b border-[#eee] pb-3">
              <div>
                <div className="font-bold">{demoRequest.code}</div>
                <div className="text-xs text-[#777]">Tạo lúc {demoRequest.createdAt}</div>
              </div>
              <span className={statusColor[demoRequest.status]}>{demoRequest.status}</span>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              {[
                ["Khách hàng", `${demoRequest.customer} (${demoRequest.customerCode})`],
                ["Đầu mối liên hệ", `${demoRequest.contact} · ${demoRequest.phone}`],
                ["Loại mẫu", `${demoRequest.matrix} – dự kiến ${demoRequest.expectedSamples} mẫu`],
                ["Hạn trả KQ", `${demoRequest.expectedDeliveryDays} ngày làm việc`],
                ["Mục đích yêu cầu", demoRequest.purpose],
                ["Quy tắc quyết định", demoRequest.decisionRule],
              ].map(([l, v]) => (
                <div key={l} className="grid gap-1 sm:grid-cols-[165px_1fr] sm:gap-x-[30px]"><span className="font-bold sm:text-right">{l}:</span><span>{v}</span></div>
              ))}
            </div>
            <table className={`${table} mt-4`}>
              <thead><tr><th>Chỉ tiêu</th><th>Phương pháp</th><th className="text-right">Đơn giá/mẫu</th><th className="text-right">× {demoRequest.expectedSamples} mẫu</th></tr></thead>
              <tbody>
                {demoRequest.criteria.map((c) => (
                  <tr key={c.name}><td>{c.name}</td><td>{c.method}</td><td className="text-right">{formatCurrency(c.unitPrice)}</td><td className="text-right">{formatCurrency(c.unitPrice * demoRequest.expectedSamples)}</td></tr>
                ))}
                <tr><td colSpan={3} className="text-right">Cộng (chưa VAT)</td><td className="text-right">{formatCurrency(demoTotals.subtotal)} đ</td></tr>
                <tr><td colSpan={3} className="text-right">VAT ({demoRequest.vatRate}%)</td><td className="text-right">{formatCurrency(demoTotals.vat)} đ</td></tr>
                <tr className="font-bold"><td colSpan={3} className="text-right">Tổng cộng</td><td className="text-right">{formatCurrency(demoTotals.total)} đ</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </LabPage>
  );
}
