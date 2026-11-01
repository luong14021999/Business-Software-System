import Link from "next/link";
import { CalendarDays, Download, Plus } from "lucide-react";
import { HomeTabs } from "@/components/m2/home/home-tabs";
import { btn, input, table } from "@/components/m2/lab-ui/page";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { orderStore, workScheduleStore } from "@/lib/modules/m2/data/orders";
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

/** Lịch công tác tuần: mỗi dòng một nhân viên, mỗi cột một ngày (thứ 2 → chủ nhật). */
export default async function WorkSchedulePage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day } = await searchParams;
  const today = todayISO();
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(day ?? "") ? day! : today;
  const week = weekOf(anchor);
  const [items, staff, orders, access] = await Promise.all([workScheduleStore.list(), staffStore.list(), orderStore.list(), currentAccess()]);
  const inWeek = items.filter((w) => w.day >= week[0].iso && w.day <= week[6].iso);
  const people = [...new Set([...staff.map((s) => s.fullName), ...inWeek.map((w) => w.staffName)].filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const canWrite = access.can("write.any");
  const fields: CrudField[] = [
    { name: "staffName", label: "Nhân viên", type: "select", required: true, options: people },
    { name: "day", label: "Ngày", type: "date", required: true },
    { name: "kind", label: "Loại", type: "select", options: [...SCHEDULE_KINDS] },
    { name: "hours", label: "Số giờ làm việc", type: "number", nullable: true },
    { name: "title", label: "Kế hoạch / nội dung", required: true, full: true },
    { name: "orderId", label: "Đơn hàng", type: "select", options: [{ value: "", label: "— Không gắn đơn hàng —" }, ...orders.sort((a, b) => b.code.localeCompare(a.code, undefined, { numeric: true })).map((o) => ({ value: o.id, label: `${o.code} · ${o.name}` }))] },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const orderCode = new Map(orders.map((o) => [o.id, o.code]));
  const end = week[6].iso;

  return (
    <main className="flex-1 overflow-y-auto bg-white scrollbar-thin">
      <div className="mx-auto max-w-[1500px] px-4 pb-10 pt-5">
        <HomeTabs active="schedule" />
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Link href={`/work-schedule?day=${addDays(anchor, -7)}`} className={btn}>Tuần trước</Link>
          <form action="/work-schedule" className="flex">
            <input type="date" name="day" defaultValue={anchor} className={`${input} !w-40 rounded-r-none`} aria-label="Chọn ngày trong tuần" />
            <button className={`${btn} rounded-l-none border-l-0`}><CalendarDays className="h-4 w-4" />Chọn tuần</button>
          </form>
          <Link href="/work-schedule" className={btn}>Tuần này</Link>
          <Link href={`/work-schedule?day=${addDays(anchor, 7)}`} className={btn}>Tuần sau</Link>
          {canWrite && (
            <EntityFormDialog
              mode="add"
              endpoint="/api/work-schedule"
              title="Thêm kế hoạch"
              fields={fields.map((f) => (f.name === "staffName" && people.includes(access.actor?.name ?? "") ? { ...f, defaultValue: access.actor!.name } : f.name === "day" ? { ...f, defaultValue: anchor } : f))}
              trigger={<button type="button" className={btn}><Plus className="h-4 w-4" />Thêm kế hoạch</button>}
            />
          )}
          <a href={`/api/work-schedule/export?from=${week[0].iso}&to=${end}`} className={btn}><Download className="h-4 w-4" />Xuất Excel</a>
        </div>
        <h2 className="mt-4 text-center text-lg font-semibold">
          Lịch công tác tuần từ ngày {week[0].label.split(" - ")[1]} đến {week[6].label.split(" - ")[1]}/{end.slice(0, 4)} – tuần {isoWeek(anchor)}
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className={`${table} table-fixed [&_td]:border-x [&_td]:border-[#ddd] [&_th]:border [&_th]:border-[#ddd]`}>
            <thead>
              <tr>
                <th className="w-44">Nhân viên</th>
                {week.map((d) => <th key={d.iso} className={d.iso === today ? "bg-[#fcf8e3]" : undefined} style={{ width: 170 }}>{d.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {people.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">-Không có nhân viên-</td></tr>}
              {people.map((p) => (
                <tr key={p}>
                  <td className="font-medium">{p}</td>
                  {week.map((d) => (
                    <td key={d.iso} className={d.iso === today ? "bg-[#fffdf3]" : undefined}>
                      <div className="space-y-1">
                        {inWeek.filter((w) => w.staffName === p && w.day === d.iso).map((w) => (
                          <div key={w.id} className={`rounded-sm border-l-4 px-1.5 py-1 text-xs ${KIND_TONE[w.kind] ?? "border-l-[#ccc] bg-[#f9f9f9]"}`}>
                            <div className="font-semibold">{w.kind}{w.hours ? ` · ${w.hours}h` : ""}{w.orderId && orderCode.get(w.orderId) ? ` · ĐH ${orderCode.get(w.orderId)}` : ""}</div>
                            <div className="break-words">{w.title}</div>
                            {canWrite && (
                              <div className="mt-1 flex gap-1">
                                <EntityFormDialog mode="edit" endpoint="/api/work-schedule" id={w.id} title="Sửa kế hoạch" fields={fields} initial={w} trigger={<button type="button" className="text-[11px] text-[#337ab7] hover:underline">Sửa</button>} />
                                <DeleteEntityButton entity="work-schedule" id={w.id} label={w.title} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
