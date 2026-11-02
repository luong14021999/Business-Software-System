"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Move, Plus } from "lucide-react";
import Link from "next/link";
import { XModal } from "@/components/m2/lab-ui/x-modal";
import { btn, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Opt = { value: string; label: string };
export type PlanValue = { id?: string; staffName: string; day: string; kind: string; title: string; workTime: string; hours: number | null; orderId: string; note: string };

const group = "rounded-none first:rounded-l last:rounded-r -ml-px first:ml-0";

/** Nhóm nút tuần như XaLab: ◀ Tuần trước | Chọn tuần (hộp thoại "Ngày đi đến") | Tuần này | Tuần sau ▶. */
export function WeekNav({ prev, next, anchor }: { prev: string; next: string; anchor: string }) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(anchor);
  const router = useRouter();
  return (
    <div className="flex">
      <Link href={`/work-schedule?day=${prev}`} className={`${btnPrimary} ${group}`}><ChevronLeft className="h-4 w-4 fill-current" />Tuần trước</Link>
      <button type="button" onClick={() => setOpen(true)} className={`${btnPrimary} ${group}`}><CalendarDays className="h-4 w-4" />Chọn tuần</button>
      <Link href="/work-schedule" className={`${btnPrimary} ${group}`}><Move className="h-4 w-4" />Tuần này</Link>
      <Link href={`/work-schedule?day=${next}`} className={`${btnPrimary} ${group}`}>Tuần sau<ChevronRight className="h-4 w-4 fill-current" /></Link>
      <XModal
        open={open}
        title="Chọn tuần"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className={btn}>Hủy</button>
            <button type="button" onClick={() => { setOpen(false); router.push(`/work-schedule?day=${day}`); }} disabled={!day} className={btnPrimary}>Đi đến</button>
          </>
        }
      >
        <label className="grid items-center gap-1 sm:grid-cols-[150px_1fr]">
          <span className="text-sm font-bold sm:text-right sm:pr-4">Ngày đi đến:</span>
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={input} />
        </label>
      </XModal>
    </div>
  );
}

/** Hộp thoại thêm / sửa kế hoạch: [Hủy] [Thêm kế hoạch] hoặc [Xóa kế hoạch] [Lưu kế hoạch]. */
function PlanDialog({ open, onClose, value, kinds, orders, staff, canPickStaff }: { open: boolean; onClose: () => void; value: PlanValue; kinds: string[]; orders: Opt[]; staff: string[]; canPickStaff: boolean }) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const set = (patch: Partial<PlanValue>) => setV((x) => ({ ...x, ...patch }));
  async function send(method: "POST" | "PATCH" | "DELETE") {
    if (method !== "DELETE") {
      if (!v.kind) return toast.error("Chọn loại kế hoạch");
      if (!v.day) return toast.error("Chọn ngày");
      if (!v.title.trim()) return toast.error("Nhập kế hoạch");
      if (!v.staffName) return toast.error("Chọn nhân viên");
    } else if (!confirm("Xóa kế hoạch này?")) return;
    setBusy(method);
    const url = method === "POST" ? "/api/work-schedule" : `/api/work-schedule/${v.id}`;
    const body = method === "DELETE" ? undefined : JSON.stringify({ ...v, hours: v.hours === null || String(v.hours) === "" ? null : Number(v.hours) });
    const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    toast.success(method === "DELETE" ? "Đã xóa kế hoạch" : "Đã lưu kế hoạch");
    onClose();
    start(() => router.refresh());
  }
  const row = "grid items-center gap-1 sm:grid-cols-[150px_1fr]";
  const label = "text-sm font-bold sm:pr-4 sm:text-right";
  const spin = (k: string) => busy === k && <Loader2 className="h-4 w-4 animate-spin" />;
  return (
    <XModal
      open={open}
      title={v.id ? "Sửa kế hoạch" : "Thêm kế hoạch cá nhân"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn}>Hủy</button>
          {v.id ? (
            <>
              <button type="button" disabled={Boolean(busy)} onClick={() => send("DELETE")} className="inline-flex h-[34px] items-center gap-1.5 rounded border border-[#d43f3a] bg-[#d9534f] px-3 text-sm text-white hover:bg-[#c9302c]">{spin("DELETE")}Xóa kế hoạch</button>
              <button type="button" disabled={Boolean(busy)} onClick={() => send("PATCH")} className={btnPrimary}>{spin("PATCH")}Lưu kế hoạch</button>
            </>
          ) : (
            <button type="button" disabled={Boolean(busy)} onClick={() => send("POST")} className={btnPrimary}>{spin("POST")}Thêm kế hoạch</button>
          )}
        </>
      }
    >
      <div className="space-y-[15px]">
        <label className={row}><span className={label}>Loại:</span>
          <select value={v.kind} onChange={(e) => set({ kind: e.target.value })} className={input}>
            <option value="">-chọn loại-</option>
            {[...new Set([...kinds, v.kind].filter(Boolean))].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label className={row}><span className={label}>Ngày:</span><input type="date" value={v.day} onChange={(e) => set({ day: e.target.value })} className={input} /></label>
        <label className={row}><span className={label}>Đơn hàng:</span>
          <select value={v.orderId} onChange={(e) => set({ orderId: e.target.value })} className={input}>
            <option value="" />
            {orders.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className={row}><span className={label}>Kế hoạch:</span><input value={v.title} onChange={(e) => set({ title: e.target.value })} className={input} /></label>
        <label className={row}><span className={label}>Thời gian làm việc:</span><input value={v.workTime} onChange={(e) => set({ workTime: e.target.value })} placeholder="VD 8h00 – 17h00" className={input} /></label>
        <label className={row}><span className={label}>Số giờ làm việc:</span><input type="number" step="any" value={v.hours ?? ""} onChange={(e) => set({ hours: e.target.value === "" ? null : Number(e.target.value) })} className={input} /></label>
        <label className={`${row} sm:items-start`}><span className={`${label} sm:pt-2`}>Ghi chú:</span><textarea rows={3} value={v.note} onChange={(e) => set({ note: e.target.value })} className={`${input} h-auto py-1.5`} /></label>
        <label className={row}><span className={label}>Nhân viên:</span>
          <select value={v.staffName} disabled={!canPickStaff} onChange={(e) => set({ staffName: e.target.value })} className={input}>
            <option value="" />
            {[...new Set([...staff, v.staffName].filter(Boolean))].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
    </XModal>
  );
}

type Shared = { kinds: string[]; orders: Opt[]; staff: string[]; canPickStaff: boolean };

/** Nút "Thêm kế hoạch cá nhân +". */
export function AddPlanButton({ initial, ...shared }: Shared & { initial: PlanValue }) {
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(0);
  return (
    <>
      <button type="button" onClick={() => { setN((x) => x + 1); setOpen(true); }} className={btn}>Thêm kế hoạch cá nhân <Plus className="h-4 w-4 stroke-[3]" /></button>
      {open && <PlanDialog key={n} open onClose={() => setOpen(false)} value={initial} {...shared} />}
    </>
  );
}

/** Ô kế hoạch trong bảng tuần: bấm để sửa / xóa (kế hoạch nhập tay, người có quyền). */
export function PlanChip({ value, editable, className, children, ...shared }: Shared & { value: PlanValue; editable: boolean; className: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!editable) return <div className={className}>{children}</div>;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${className} block w-full text-left hover:brightness-95`}>{children}</button>
      {open && <PlanDialog open onClose={() => setOpen(false)} value={value} {...shared} />}
    </>
  );
}
