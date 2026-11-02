import { archivedSamplesStore } from "@/lib/modules/m2/data/archived-samples";
import { AddArchivedSampleDialog } from "@/components/m2/archive/add-archived-sample-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { LabPage, table } from "@/components/m2/lab-ui/page";
import { XTabs } from "@/components/m2/lab-ui/x-tabs";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { daysUntil } from "@/lib/platform/dates";
import { type ArchivedSample } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

/** Màu chữ trạng thái kiểu Bootstrap. */
const statusColor: Record<ArchivedSample["status"], string> = {
  "Đang lưu": "text-[#31708f]",
  "Đã phân tích QC": "text-[#3c763d]",
  "Đã hủy": "text-[#777]",
};

const TABS: { key: string; label: string; status?: ArchivedSample["status"] }[] = [
  { key: "dang-luu", label: "Đang lưu", status: "Đang lưu" },
  { key: "qc", label: "Đã phân tích QC", status: "Đã phân tích QC" },
  { key: "da-huy", label: "Đã hủy", status: "Đã hủy" },
  { key: "", label: "Tất cả" },
];

/** Kho mẫu lưu (QC định kỳ 3 tháng/lần) theo kiểu XaLab: số liệu tóm tắt, tab trạng thái, bảng mẫu lưu. */
export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ q?: string; tt?: string }> }) {
  const { q = "", tt = "" } = await searchParams;
  const all = await archivedSamplesStore.list();
  const query = q.trim().toLowerCase();
  const tab = TABS.find((t) => t.key === tt) ?? TABS[TABS.length - 1];
  const archivedSamples = all
    .filter((s) => !tab.status || s.status === tab.status)
    .filter(
      (s) =>
        !query ||
        s.archiveCode.toLowerCase().includes(query) ||
        s.originalSampleCode.toLowerCase().includes(query) ||
        s.customer.toLowerCase().includes(query) ||
        s.type.toLowerCase().includes(query) ||
        s.location.toLowerCase().includes(query),
    );

  const active = all.filter((s) => s.status === "Đang lưu");
  const expiringSoon = active.filter((s) => daysUntil(s.expiryAt) <= 60);
  const qcDone = all.filter((s) => s.status === "Đã phân tích QC");
  const destroyed = all.filter((s) => s.status === "Đã hủy");

  const stats = [
    { label: "Mẫu đang lưu", value: active.length },
    { label: "Sắp hết hạn (≤ 60 ngày)", value: expiringSoon.length },
    { label: "Đã phân tích QC năm nay", value: qcDone.length },
    { label: "Mẫu đã hủy", value: destroyed.length },
  ];

  const qcDueSchedule = [...active]
    .map((s) => {
      const nextQc = new Date(s.archivedAt);
      nextQc.setMonth(nextQc.getMonth() + 3);
      return { ...s, nextQcAt: nextQc.toISOString().slice(0, 10) };
    })
    .sort((a, b) => daysUntil(a.nextQcAt) - daysUntil(b.nextQcAt))
    .slice(0, 5);

  const tabHref = (key: string) => {
    const p = new URLSearchParams(Object.entries({ q, tt: key }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/archive${p.size ? `?${p}` : ""}`;
  };

  return (
    <LabPage
      title="Kho mẫu lưu"
      subtitle="Quản lý mẫu lưu phục vụ phân tích QC định kỳ 3 tháng/lần theo ISO/IEC 17025"
      toolbar={
        <>
          <EntitySearchInput basePath="/archive" placeholder="Tìm mã lưu, mã mẫu gốc..." />
          <AddArchivedSampleDialog />
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

      <h2 className="mb-1 text-xl font-medium">Danh sách mẫu lưu</h2>
      <p className="mb-3 text-sm text-[#777]">Theo dõi vị trí, hạn lưu và mục đích – ràng buộc với mẫu gốc đã trả KQ</p>
      <XTabs tabs={TABS.map((t) => ({ label: t.label, href: tabHref(t.key) }))} active={tabHref(tab.key)} />
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th>Mã mẫu lưu</th>
              <th>Mẫu gốc</th>
              <th>Loại mẫu</th>
              <th>Vị trí</th>
              <th>Ngày lưu</th>
              <th>Hạn lưu</th>
              <th>Lượng còn</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {archivedSamples.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-muted-foreground">
                  {query ? `Không có mẫu lưu nào khớp "${query}"` : "Chưa có mẫu lưu nào"}
                </td>
              </tr>
            )}
            {archivedSamples.map((s) => {
              const expiringSoonFlag = s.status === "Đang lưu" && daysUntil(s.expiryAt) <= 60;
              return (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.archiveCode}</td>
                  <td className="font-mono text-xs">
                    {s.originalSampleCode}
                    <div className="mt-0.5 font-sans text-[#777]">{s.customer}</div>
                  </td>
                  <td>{s.type}</td>
                  <td>{s.location}</td>
                  <td className="whitespace-nowrap">{s.archivedAt}</td>
                  <td className={`whitespace-nowrap ${expiringSoonFlag ? "font-bold text-[#8a6d3b]" : ""}`}>
                    {s.expiryAt}
                    {expiringSoonFlag && " ⚠"}
                  </td>
                  <td>{s.amount}</td>
                  <td className={statusColor[s.status]}>{s.status}</td>
                  <td className="text-right">
                    <XDeleteLink url={`/api/archived-samples/${s.id}`} label={s.archiveCode} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 text-xl font-medium">Lịch phân tích mẫu lưu (3 tháng/lần)</h2>
          <p className="mb-3 text-sm text-[#777]">Tự sinh từ ngày lưu – phục vụ kiểm soát chất lượng nội bộ</p>
          <table className={table}>
            <thead>
              <tr><th>Mẫu</th><th>Ngày QC</th><th /></tr>
            </thead>
            <tbody>
              {qcDueSchedule.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">Không có mẫu đang lưu</td></tr>}
              {qcDueSchedule.map((s) => {
                const days = daysUntil(s.nextQcAt);
                return (
                  <tr key={s.id}>
                    <td>
                      {s.type}
                      <div className="font-mono text-xs text-[#777]">{s.archiveCode} ← {s.originalSampleCode}</div>
                    </td>
                    <td className="whitespace-nowrap">{s.nextQcAt}</td>
                    <td className={`whitespace-nowrap text-right ${days < 0 ? "font-bold text-[#a94442]" : days <= 14 ? "text-[#8a6d3b]" : "text-[#777]"}`}>
                      {days < 0 ? `Trễ ${Math.abs(days)} ngày` : `Còn ${days} ngày`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-1 text-xl font-medium">Biên bản hủy mẫu gần đây</h2>
          <p className="mb-3 text-sm text-[#777]">Lưu trữ tối thiểu 5 năm phục vụ truy xuất ISO/IEC 17025</p>
          <table className={table}>
            <thead>
              <tr><th>Mẫu</th><th>Ngày</th></tr>
            </thead>
            <tbody>
              {destroyed.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">Chưa có mẫu nào bị hủy.</td></tr>}
              {destroyed.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.type}
                    <div className="font-mono text-xs text-[#777]">{s.archiveCode} ← {s.originalSampleCode}</div>
                    {s.qcNote && <div className="text-xs text-[#777]">{s.qcNote}</div>}
                  </td>
                  <td className="whitespace-nowrap">{s.qcAnalysisAt ?? s.expiryAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </LabPage>
  );
}
