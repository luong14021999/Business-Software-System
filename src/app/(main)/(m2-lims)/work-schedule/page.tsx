import Link from "next/link";
import { FileDown } from "lucide-react";
import { HomeTabs } from "@/components/m2/home/home-tabs";
import { AddPlanButton, PlanChip, WeekNav } from "@/components/m2/home/schedule-ui";
import { LabFooter, btn } from "@/components/m2/lab-ui/page";
import { eventTypeStore } from "@/lib/modules/m2/data/catalogs";
import { orderStore } from "@/lib/modules/m2/data/orders";
import { scheduleBetween } from "@/lib/modules/m2/data/home";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { SCHEDULE_KINDS, addDays, isoWeek, weekOf } from "@/lib/modules/m2/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const KIND_TONE: Record<string, string> = {
  "Kế hoạch quan trắc": "border-l-[#f0ad4e] bg-[#fcf8e3]",
  "Lấy mẫu": "border-l-[#f0ad4e] bg-[#fcf8e3]",
  "Phân tích": "border-l-[#5bc0de] bg-[#d9edf7]",
  "Công tác": "border-l-[#5cb85c] bg-[#dff0d8]",
  "Họp": "border-l-[#337ab7] bg-[#eef4fb]",
  "Nghỉ phép": "border-l-[#999] bg-[#f5f5f5]",
};

/** Lịch công tác tuần như XaLab: mỗi dòng một nhân viên, mỗi cột một ngày (thứ 2 → chủ nhật); lịch quan trắc tự hiện theo kế hoạch quan trắc của đơn. */
export default async function WorkSchedulePage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day } = await searchParams;
  const today = todayISO();
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(day ?? "") ? day! : today;
  const week = weekOf(anchor);
  const [inWeek, staff, orders, types, access] = await Promise.all([scheduleBetween(week[0].iso, week[6].iso), staffStore.list(), orderStore.list(), eventTypeStore.list(), currentAccess()]);
  const me = access.actor?.name ?? "";
  const people = [...new Set([...staff.map((s) => s.fullName), ...inWeek.map((w) => w.staffName)].filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const canWrite = access.can("write.any");
  // Quản lý / Quản trị lập kế hoạch cho mọi người; nhân viên chỉ thêm, sửa kế hoạch của chính mình.
  const manager = !access.enabled || access.roles.some((r) => r === "Quản lý" || r === "Quản trị");
  const shared = {
    kinds: types.length ? [...types].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "vi")).map((t) => t.name) : [...SCHEDULE_KINDS],
    orders: orders.filter((o) => o.status !== "Hủy").sort((a, b) => b.code.localeCompare(a.code, undefined, { numeric: true })).map((o) => ({ value: o.id, label: `${o.code} · ${o.name}` })),
    staff: people,
    canPickStaff: manager,
  };
  const orderCode = new Map(orders.map((o) => [o.id, o.code]));
  const [, startLabel] = week[0].label.split(" - ");
  const [, endLabel] = week[6].label.split(" - ");
  const sunday = (i: number) => i === 6;

  return (
    <main className="flex-1 overflow-y-auto bg-white scrollbar-thin">
      <div className="mx-auto max-w-[1170px] px-[15px] pt-5">
        <HomeTabs active="schedule" />
        <div className="mt-[10px] flex flex-wrap items-center gap-1">
          <WeekNav prev={addDays(anchor, -7)} next={addDays(anchor, 7)} anchor={anchor} />
          {canWrite && (me || manager) && (
            <AddPlanButton {...shared} initial={{ staffName: people.includes(me) ? me : "", day: anchor, kind: "", title: "", workTime: "", hours: null, orderId: "", note: "" }} />
          )}
          <a href={`/api/work-schedule/export?from=${week[0].iso}&to=${week[6].iso}`} className={btn}>Xuất Excel <FileDown className="h-4 w-4" /></a>
        </div>
        <h2 className="mb-[10px] mt-5 text-2xl font-medium text-[#333]">
          Lịch công tác tuần từ ngày {startLabel} đến {endLabel}/{week[6].iso.slice(0, 4)} - tuần {isoWeek(anchor)}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse border border-[#ddd] text-sm text-[#333] [&_td]:border [&_td]:border-[#ddd] [&_td]:p-[5px] [&_td]:align-top [&_th]:border [&_th]:border-[#ddd] [&_th]:px-[5px] [&_th]:py-[7px] [&_th]:text-left">
            <thead>
              <tr>
                <th className="w-[182px] bg-[#dff0d8]">Nhân viên</th>
                {week.map((d, i) => <th key={d.iso} className={`min-w-[120px] ${sunday(i) ? "bg-[#c8e5bc]" : "bg-[#dff0d8]"} ${d.iso === today ? "underline" : ""}`}>{d.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {people.length === 0 && (
                <tr><td className="bg-[#fcf8e3] font-bold">-Không có nhân viên-</td>{week.map((d, i) => <td key={d.iso} className={sunday(i) ? "bg-[#eee]" : "bg-[#fcf8e3]"} />)}</tr>
              )}
              {people.map((p) => (
                <tr key={p}>
                  <td className="bg-[#fcf8e3] font-bold">{p}</td>
                  {week.map((d, i) => (
                    <td key={d.iso} className={sunday(i) ? "bg-[#eee]" : "bg-[#fcf8e3]"}>
                      <div className="space-y-1">
                        {inWeek.filter((w) => w.staffName === p && w.day === d.iso).map((w) => {
                          const tone = `rounded-sm border-l-4 px-1.5 py-1 text-xs ${KIND_TONE[w.kind] ?? "border-l-[#ccc] bg-white"}`;
                          const body = (
                            <>
                              <div className="font-semibold">{w.kind}{w.hours ? ` · ${w.hours}h` : ""}{w.orderId && orderCode.get(w.orderId) ? ` · ĐH ${orderCode.get(w.orderId)}` : ""}</div>
                              <div className="break-words">{w.title}</div>
                              {w.workTime && <div className="text-[#777]">{w.workTime}</div>}
                            </>
                          );
                          return w.auto ? (
                            <Link key={w.id} href={`/orders/${w.orderId}/plan`} className={`${tone} block hover:brightness-95`} title="Tự động từ kế hoạch quan trắc của đơn hàng">{body}</Link>
                          ) : (
                            <PlanChip key={w.id} {...shared} className={tone} editable={canWrite && (manager || w.staffName === me)} value={{ id: w.id, staffName: w.staffName, day: w.day.slice(0, 10), kind: w.kind, title: w.title, workTime: w.workTime ?? "", hours: w.hours, orderId: w.orderId, note: w.note }}>
                              {body}
                            </PlanChip>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LabFooter />
      </div>
    </main>
  );
}
