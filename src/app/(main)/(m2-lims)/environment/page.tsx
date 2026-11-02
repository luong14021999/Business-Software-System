import Link from "next/link";
import { LabPage, link, table } from "@/components/m2/lab-ui/page";
import { XDeleteLink } from "@/components/m2/lab-ui/x-delete";
import { environmentStore } from "@/lib/modules/m2/data/environment";
import { AddEnvironmentReadingDialog } from "@/components/m2/environment/add-reading-dialog";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";

const ENV_FIELDS: CrudField[] = [
  { name: "room", label: "Phòng", required: true },
  { name: "parameter", label: "Thông số", type: "select", options: ["Nhiệt độ", "Độ ẩm"] },
  { name: "monitoringDevice", label: "Thiết bị kiểm soát", full: true },
  { name: "value", label: "Giá trị đo", type: "number" },
  { name: "unit", label: "ĐVT" },
  { name: "limit", label: "Giới hạn" },
  { name: "recordedAt", label: "Thời điểm", type: "datetime-local" },
  { name: "observer", label: "Người theo dõi" },
  { name: "pass", label: "Nhận xét", type: "bool" },
  { name: "note", label: "Ghi chú", full: true },
];

export const dynamic = "force-dynamic";

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const YEARS = ["2024", "2025", "2026", "2027"];
const PARAMS = ["Nhiệt độ", "Độ ẩm"] as const;

type Reading = Awaited<ReturnType<typeof environmentStore.list>>[number];

/** Nút Sửa (mở form) | Xóa của một lần đo. */
function RowActions({ r, label }: { r: Reading; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <EntityFormDialog
        mode="edit"
        endpoint="/api/environment"
        id={r.id}
        title="Sửa lần đo môi trường"
        fields={ENV_FIELDS}
        initial={r}
        submitLabel="Lưu thay đổi"
        trigger={<button type="button" className={link}>Sửa</button>}
      />
      <span className="text-[#333]">|</span>
      <XDeleteLink url={`/api/environment/${r.id}`} label={label} />
    </span>
  );
}

/** Lựa chọn dạng link, mục đang chọn tô đậm (như nhóm nút lọc của XaLab). */
function Choice({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return on ? <span className="rounded border border-[#2e6da4] bg-[#337ab7] px-2 py-0.5 text-white">{children}</span> : <Link href={href} className="rounded border border-[#ccc] px-2 py-0.5 text-[#333] hover:bg-[#e6e6e6]">{children}</Link>;
}

/** Phiếu theo dõi môi trường (AEMD-BM-10.02) theo kiểu XaLab: chọn phòng / thông số / tháng / năm, bảng 31 ngày, bản ghi gần đây. */
export default async function EnvironmentPage({ searchParams }: { searchParams: Promise<{ room?: string; param?: string; month?: string; year?: string }> }) {
  const sp = await searchParams;
  const all = await environmentStore.list();

  const rooms = Array.from(new Set(all.map((r) => r.room))).sort();

  const room = sp.room ?? rooms[0] ?? "P. Đất & Phân bón";
  const param = (sp.param as "Nhiệt độ" | "Độ ẩm") ?? "Nhiệt độ";
  const month = sp.month ?? "07";
  const year = sp.year ?? "2026";
  const yyyymm = `${year}-${month}`;

  // Chọn tất cả bản ghi khớp filter (1 phiếu = phòng × thông số × tháng)
  const sheet = all.filter((r) => r.room === room && r.parameter === param && r.recordedAt.startsWith(yyyymm));

  const monitoringDevice = sheet[0]?.monitoringDevice ?? "—";
  const limit = sheet[0]?.limit ?? "—";
  const unit = sheet[0]?.unit ?? "";

  // Map ngày → bản ghi (nếu có nhiều lần đo cùng ngày, lấy cái mới nhất)
  const byDay = new Map<number, (typeof sheet)[number]>();
  for (const r of sheet) {
    const day = Number(r.recordedAt.slice(8, 10));
    const existing = byDay.get(day);
    if (!existing || r.recordedAt > existing.recordedAt) byDay.set(day, r);
  }

  const failCount = sheet.filter((r) => !r.pass).length;
  const passCount = sheet.filter((r) => r.pass).length;

  const stats = [
    { label: "Lần đo tháng này", value: sheet.length },
    { label: "Đạt", value: passCount },
    { label: "Không đạt", value: failCount },
    { label: "Phòng đang giám sát", value: rooms.length },
  ];

  function selectHref(patch: { room?: string; param?: string; month?: string; year?: string }) {
    const p = new URLSearchParams({ room, param, month, year, ...patch });
    return `/environment?${p.toString()}`;
  }

  const verdict = (pass: boolean) => <span className={pass ? "text-[#3c763d]" : "font-bold text-[#a94442]"}>{pass ? "Đ" : "K"}</span>;

  return (
    <LabPage
      title="Phiếu theo dõi môi trường"
      subtitle="AEMD-BM-10.02 · ISO/IEC 17025:2017 §6.3 – Kiểm soát tiện nghi môi trường phòng phân tích"
      toolbar={<AddEnvironmentReadingDialog defaultRoom={room} defaultParameter={param} />}
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

      <h2 className="mb-1 text-xl font-medium">Chọn phiếu theo tháng</h2>
      <p className="mb-3 text-sm text-[#777]">Mỗi phiếu = 1 phòng × 1 thông số × 1 tháng</p>
      <div className="space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-1">
          <span className="w-20 font-bold">Phòng:</span>
          {rooms.map((r) => <Choice key={r} href={selectHref({ room: r })} on={r === room}>{r}</Choice>)}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <span className="w-20 font-bold">Thông số:</span>
          {PARAMS.map((p) => <Choice key={p} href={selectHref({ param: p })} on={p === param}>{p}</Choice>)}
        </div>
        <div className="flex flex-wrap items-center gap-1 tabular-nums">
          <span className="w-20 font-bold">Tháng:</span>
          {MONTHS.map((m) => <Choice key={m} href={selectHref({ month: m })} on={m === month}>{m}</Choice>)}
        </div>
        <div className="flex flex-wrap items-center gap-1 tabular-nums">
          <span className="w-20 font-bold">Năm:</span>
          {YEARS.map((y) => <Choice key={y} href={selectHref({ year: y })} on={y === year}>{y}</Choice>)}
        </div>
      </div>

      <h2 className="mb-1 mt-8 text-xl font-medium">Phiếu theo dõi môi trường – Tháng {month}/{year}</h2>
      <p className="mb-3 text-sm text-[#777]">Mẫu AEMD-BM-10.02 lần ban hành 2 · in ra ký như bản giấy</p>
      <table className={`${table} mb-4`}>
        <tbody>
          <tr><td className="w-64 font-bold">Phòng / vị trí kiểm soát</td><td>{room}</td></tr>
          <tr><td className="font-bold">Thiết bị dùng để kiểm soát</td><td>{monitoringDevice}</td></tr>
          <tr><td className="font-bold">Thông số + giới hạn</td><td>{param} · {limit}</td></tr>
        </tbody>
      </table>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className="w-[70px] text-center">Ngày</th>
              <th>Kết quả ({unit || "—"})</th>
              <th className="w-[100px] text-center">Nhận xét</th>
              <th>Người theo dõi</th>
              <th>Ghi chú</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const r = byDay.get(day);
              return (
                <tr key={day} className={r ? "" : "text-[#999]"}>
                  <td className="text-center font-mono">{day}</td>
                  <td>{r ? <span className={!r.pass ? "font-bold text-[#a94442]" : ""}>{r.value} {r.unit}</span> : "—"}</td>
                  <td className="text-center">{r ? verdict(r.pass) : ""}</td>
                  <td>{r?.observer ?? ""}</td>
                  <td className="text-[#777]">{r?.note ?? ""}</td>
                  <td className="text-right">{r && <RowActions r={r} label={`ngày ${day}`} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs italic text-[#777]">
        * Các thông số kiểm soát có thể thay đổi tùy yêu cầu (VD: nhiệt độ, độ ẩm, ánh sáng…).
        {sheet.length === 0 && <span className="ml-1 not-italic text-[#a94442]">Chưa có lần đo nào cho phiếu này – bấm &quot;Ghi nhận đo&quot; để bắt đầu.</span>}
      </p>

      <h2 className="mb-1 mt-8 text-xl font-medium">Bản ghi gần đây (mọi phiếu)</h2>
      <p className="mb-3 text-sm text-[#777]">20 lần đo mới nhất trên tất cả phòng và thông số</p>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th>Thời điểm</th>
              <th>Phòng</th>
              <th>Thông số</th>
              <th>Giá trị</th>
              <th>Giới hạn</th>
              <th>Nhận xét</th>
              <th>Người theo dõi</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {[...all]
              .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))
              .slice(0, 20)
              .map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap font-mono text-xs">{r.recordedAt}</td>
                  <td>{r.room}</td>
                  <td>{r.parameter}</td>
                  <td>{r.value} {r.unit}</td>
                  <td className="text-[#777]">{r.limit}</td>
                  <td>{verdict(r.pass)}</td>
                  <td>{r.observer}</td>
                  <td className="text-right"><RowActions r={r} label={`${r.room} · ${r.recordedAt}`} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </LabPage>
  );
}
