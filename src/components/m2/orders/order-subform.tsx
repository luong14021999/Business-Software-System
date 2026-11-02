"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, Clock, Loader2, X } from "lucide-react";
import { btn, btnPrimary, input, link } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** Thanh nút cuối các trang con của đơn hàng như XaLab: [←][lịch sử][Lưu & thoát][Lưu]. */
function SaveBar({ orderId, busy, onSave }: { orderId: string; busy: string | null; onSave: (exit: boolean) => void }) {
  return (
    <>
      <hr className="my-5 border-[#eee]" />
      <div className="flex gap-1">
        <Link href="/orders" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
        <Link href={`/orders/${orderId}/history`} className={btn} aria-label="Lịch sử thay đổi" title="Lịch sử thay đổi"><Clock className="h-4 w-4" /></Link>
        <button type="button" disabled={Boolean(busy)} onClick={() => onSave(true)} className={btnPrimary}>{busy === "exit" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
        <button type="button" disabled={Boolean(busy)} onClick={() => onSave(false)} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
      </div>
    </>
  );
}

/** Gửi lưu rồi về danh sách đơn (Lưu & thoát) hoặc tải lại trang. */
function useSave(url: string, method: string) {
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  async function save(exit: boolean, body: unknown) {
    setBusy(exit ? "exit" : "save");
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu");
    start(() => (exit ? router.push("/orders") : router.refresh()));
  }
  return { busy, save };
}

const green = "inline-flex h-[34px] items-center gap-1 rounded border border-[#4cae4c] bg-[#5cb85c] px-3 text-sm text-white hover:bg-[#449d44]";

/** Nhân sự quan trắc: trưởng đoàn, giám sát, 2 phó trưởng đoàn và các nhóm 4 người. */
export function TeamEditor({ orderId, staff, initial }: { orderId: string; staff: string[]; initial: { leader: string; supervisor: string; deputy1: string; deputy2: string; groups: string[][] } }) {
  const [f, setF] = useState(initial);
  const [groups, setGroups] = useState<string[][]>(initial.groups.map((g) => Array.from({ length: 4 }, (_, i) => g[i] ?? "")));
  const { busy, save } = useSave(`/api/orders/${orderId}/plan`, "PATCH");
  const pick = (value: string, onChange: (v: string) => void, label: string) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={input}>
      <option value="">chọn nhân sự</option>
      {staff.map((s) => <option key={s}>{s}</option>)}
      {value && !staff.includes(value) && <option>{value}</option>}
    </select>
  );
  const cell = "grid items-center gap-1 sm:grid-cols-[165px_minmax(0,1fr)] sm:gap-x-[30px]";
  const lbl = "text-sm font-bold sm:text-right";
  return (
    <div>
      <div className="grid gap-x-[30px] gap-y-[15px] md:grid-cols-2">
        <div className={cell}><span className={lbl}>Trưởng đoàn</span>{pick(f.leader, (v) => setF({ ...f, leader: v }), "Trưởng đoàn")}</div>
        <div className={cell}><span className={lbl}>Giám sát</span>{pick(f.supervisor, (v) => setF({ ...f, supervisor: v }), "Giám sát")}</div>
        <div className={cell}><span className={lbl}>Phó trưởng đoàn 1</span>{pick(f.deputy1, (v) => setF({ ...f, deputy1: v }), "Phó trưởng đoàn 1")}</div>
        <div className={cell}><span className={lbl}>Phó trưởng đoàn 2</span>{pick(f.deputy2, (v) => setF({ ...f, deputy2: v }), "Phó trưởng đoàn 2")}</div>
      </div>
      <button type="button" onClick={() => setGroups((gs) => [...gs, ["", "", "", ""]])} className={`${green} mt-[15px]`}>Thêm nhóm</button>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead><tr>{[1, 2, 3, 4].map((n) => <th key={n} className="border-b-2 border-[#ddd] px-2 py-2 text-left font-bold">Nhân sự {n}</th>)}<th className="border-b-2 border-[#ddd]" /></tr></thead>
        <tbody>
          {groups.map((g, gi) => (
            <tr key={gi}>
              {g.map((v, k) => <td key={k} className="border-t border-[#ddd] px-2 py-2">{pick(v, (x) => setGroups((gs) => gs.map((row, j) => (j === gi ? row.map((y, m) => (m === k ? x : y)) : row))), `Nhóm ${gi + 1} – nhân sự ${k + 1}`)}</td>)}
              <td className="border-t border-[#ddd] px-2 py-2"><button type="button" onClick={() => setGroups((gs) => gs.filter((_, j) => j !== gi))} className={`${link} inline-flex items-center gap-0.5`}>Xóa <X className="h-3.5 w-3.5 stroke-[3]" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <SaveBar orderId={orderId} busy={busy} onSave={(exit) => save(exit, { team: { ...f, groups } })} />
    </div>
  );
}

type Supply = { name: string; unit: string; group: string; needed: number };

/** Vật tư – hóa chất: dụng cụ lấy mẫu gom theo loại (bấm để mở / đóng), tích chọn + số lượng; "Số chỉ tiêu cần" từ chỉ tiêu của đơn. */
export function SuppliesEditor({ orderId, catalog, initial }: { orderId: string; catalog: Supply[]; initial: { name: string; quantity: string }[] }) {
  const [rows, setRows] = useState(() =>
    catalog.map((c) => {
      const have = initial.find((i) => i.name === c.name);
      return { ...c, checked: Boolean(have) || c.needed > 0, quantity: have?.quantity ?? "" };
    }),
  );
  const [open, setOpen] = useState<Set<string>>(() => new Set(catalog.filter((c) => c.needed > 0 || initial.some((i) => i.name === c.name)).map((c) => c.group)));
  const { busy, save } = useSave(`/api/orders/${orderId}/plan`, "PATCH");
  const groups = [...new Set(rows.map((r) => r.group))];
  const extra = initial.filter((i) => !catalog.some((c) => c.name === i.name));
  const set = (name: string, patch: Partial<(typeof rows)[number]>) => setRows((xs) => xs.map((x) => (x.name === name ? { ...x, ...patch } : x)));
  const items = [
    ...rows.filter((r) => r.checked).map((r) => ({ kind: "Vật tư – hóa chất", name: r.name, quantity: r.quantity, note: r.unit })),
    ...extra.map((e) => ({ kind: "Vật tư – hóa chất", name: e.name, quantity: e.quantity, note: "" })),
  ];
  return (
    <div className="space-y-1">
      {groups.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dụng cụ lấy mẫu – thêm ở Cài đặt → Nhóm dụng cụ lấy mẫu.</p>}
      {groups.map((g) => {
        const isOpen = open.has(g);
        return (
          <div key={g} className="rounded border border-[#ddd]">
            <button type="button" onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(g)) n.delete(g); else n.add(g); return n; })} className="flex w-full items-center gap-1 bg-[#f5f5f5] px-[15px] py-2.5 text-left text-[17px] italic text-[#337ab7]">
              {isOpen ? <ChevronDown className="h-4 w-4 stroke-[3]" /> : <ChevronRight className="h-4 w-4 stroke-[3]" />}{g}
            </button>
            {isOpen && (
              <table className="w-full border-collapse text-sm">
                <thead><tr><th className="border-b-2 border-[#ddd] px-2 py-2 text-left">Tên</th><th className="w-16 border-b-2 border-[#ddd] px-2 py-2 text-left">Đơn vị</th><th className="w-44 border-b-2 border-[#ddd] px-2 py-2 text-left">Số lượng</th><th className="w-28 border-b-2 border-[#ddd] px-2 py-2 text-left">Số chỉ tiêu cần</th></tr></thead>
                <tbody>
                  {rows.filter((r) => r.group === g).map((r) => (
                    <tr key={r.name} className={cn(r.checked && "bg-[#dff0d8]")}>
                      <td className="border-t border-[#ddd] px-2 py-2 font-bold"><label className="flex items-start gap-1.5"><input type="checkbox" className="mt-1" checked={r.checked} onChange={(e) => set(r.name, { checked: e.target.checked })} />{r.name}</label></td>
                      <td className="border-t border-[#ddd] px-2 py-2">{r.unit}</td>
                      <td className="border-t border-[#ddd] px-2 py-2"><input value={r.quantity} onChange={(e) => set(r.name, { quantity: e.target.value, checked: e.target.value ? true : r.checked })} aria-label={`Số lượng ${r.name}`} className={`${input} h-8`} /></td>
                      <td className="border-t border-[#ddd] px-2 py-2">{r.needed || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
      <SaveBar orderId={orderId} busy={busy} onSave={(exit) => save(exit, { kinds: ["Vật tư – hóa chất"], items })} />
    </div>
  );
}

/** Bảo quản của đơn hàng: bảng tích chọn cách bảo quản × từng yêu cầu (mẫu) của một loại mẫu. */
export function PreservationGrid({ orderId, sampleTypeId, samples, preservations, initial }: { orderId: string; sampleTypeId: string; samples: { id: string; code: string; customerCode: string }[]; preservations: { id: string; name: string }[]; initial: string[] }) {
  const [on, setOn] = useState<Set<string>>(new Set(initial));
  const { busy, save } = useSave("/api/sample-preservations", "PUT");
  const key = (s: string, p: string) => `${s}|${p}`;
  const toggle = (k: string) => setOn((x) => { const n = new Set(x); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b-2 border-[#ddd] px-2 py-2 text-left align-bottom">Tên bảo quản</th>
              {samples.map((s) => (
                <th key={s.id} className="border-b-2 border-[#ddd] px-2 py-2 text-left">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" aria-label={`Chọn cả cột ${s.code}`} checked={preservations.length > 0 && preservations.every((p) => on.has(key(s.id, p.id)))} onChange={(e) => setOn((x) => { const n = new Set(x); for (const p of preservations) { if (e.target.checked) n.add(key(s.id, p.id)); else n.delete(key(s.id, p.id)); } return n; })} />
                    {s.code} ({s.customerCode})
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preservations.length === 0 && <tr><td colSpan={samples.length + 1} className="py-6 text-center text-muted-foreground">Chưa có cách bảo quản cho loại mẫu này – thêm ở Cài đặt → Bảo quản</td></tr>}
            {preservations.map((p) => (
              <tr key={p.id}>
                <td className="border-t border-[#ddd] px-2 py-2">{p.name}</td>
                {samples.map((s) => <td key={s.id} className="border-t border-[#ddd] px-2 py-2"><input type="checkbox" aria-label={`${p.name} – ${s.code}`} checked={on.has(key(s.id, p.id))} onChange={() => toggle(key(s.id, p.id))} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SaveBar orderId={orderId} busy={busy} onSave={(exit) => save(exit, { orderId, sampleTypeId, cells: [...on].map((k) => ({ sampleId: k.split("|")[0], preservationId: k.split("|")[1] })) })} />
    </div>
  );
}

