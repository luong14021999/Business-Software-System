"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btn, btnPrimary, input, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { LINE_KINDS } from "@/lib/modules/m2/orders";
import type { OrderLine } from "@/lib/modules/m2/data/orders";

type Edit = Partial<Pick<OrderLine, "analyst" | "subcontractor" | "method" | "samplingTimes" | "lineKind">>;
type Sample = { code: string; locationName: string; sampler: string };

/** Phân công từng chỉ tiêu: người phân tích, thầu phụ, phương pháp, số lần đo, hiện trường / phòng TN; áp hàng loạt cho các dòng chọn. */
export function AssignTable({ orderId, samples, lines, staff, scopes, methods, canWrite }: { orderId: string; samples: Sample[]; lines: OrderLine[]; staff: string[]; scopes: string[]; methods: string[]; canWrite: boolean }) {
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [bulk, setBulk] = useState({ analyst: "", subcontractor: "" });
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();

  const val = (l: OrderLine) => ({ ...l, ...edits[l.id] });
  const set = (id: string, e: Edit) => setEdits((x) => ({ ...x, [id]: { ...x[id], ...e } }));
  const shown = lines.filter((l) => (!kind || (val(l).lineKind || LINE_KINDS[0]) === kind) && (!onlyFree || !val(l).analyst));
  const locked = (l: OrderLine) => l.status === "Đã duyệt";
  const dirty = Object.keys(edits);

  function applyBulk() {
    const ids = shown.filter((l) => sel.has(l.id) && !locked(l)).map((l) => l.id);
    if (!ids.length) return toast.error("Chưa chọn chỉ tiêu", "Đánh dấu các dòng cần phân công");
    if (!bulk.analyst && !bulk.subcontractor) return toast.error("Chọn người phân tích hoặc thầu phụ để áp");
    for (const id of ids) set(id, { ...(bulk.analyst && { analyst: bulk.analyst }), ...(bulk.subcontractor && { subcontractor: bulk.subcontractor }) });
    toast.success(`Đã áp cho ${ids.length} dòng – bấm Lưu để ghi`);
  }

  async function save() {
    if (!dirty.length) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: dirty.map((id) => ({ id, ...edits[id] })) }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không lưu được phân công", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã lưu phân công ${b.saved} chỉ tiêu`);
    if (b.skipped?.length) toast.error(`${b.skipped.length} dòng đã duyệt – không đổi`, b.skipped.slice(0, 3).join("; "));
    setEdits({});
    setSel(new Set());
    start(() => router.refresh());
  }

  const toggle = (ids: string[], on: boolean) => setSel((s) => { const n = new Set(s); for (const id of ids) { if (on) n.add(id); else n.delete(id); } return n; });
  const people = (v: string) => [...new Set([...staff, ...(v ? [v] : [])])];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Lọc loại chỉ tiêu" className={`${input} !w-44`}>
          <option value="">Tất cả chỉ tiêu</option>
          {LINE_KINDS.map((k) => <option key={k}>{k}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} />Chỉ dòng chưa phân công</label>
      </div>
      {canWrite && (
        <div className="flex flex-wrap items-center gap-1.5 rounded border border-[#ddd] bg-[#f9f9f9] p-2">
          <span className="text-sm font-bold">Áp cho dòng đã chọn ({sel.size}):</span>
          <select value={bulk.analyst} onChange={(e) => setBulk((b) => ({ ...b, analyst: e.target.value }))} aria-label="Người phân tích áp hàng loạt" className={`${input} !w-52`}>
            <option value="">— Người phân tích —</option>
            {staff.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={bulk.subcontractor} onChange={(e) => setBulk((b) => ({ ...b, subcontractor: e.target.value }))} aria-label="Thầu phụ áp hàng loạt" className={`${input} !w-52`}>
            <option value="">— Thầu phụ —</option>
            {scopes.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button type="button" onClick={applyBulk} className={btn}>Áp</button>
          <button type="button" disabled={busy || !dirty.length} onClick={save} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Lưu{dirty.length ? ` (${dirty.length})` : ""}</button>
        </div>
      )}
      <datalist id="assign-methods">{methods.map((m) => <option key={m} value={m} />)}</datalist>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr><th className="w-6" /><th>Chỉ tiêu</th><th>Loại</th><th>Phương pháp</th><th className="w-20">Số lần đo</th><th>Người phân tích</th><th>Thầu phụ</th><th>Trạng thái</th></tr>
          </thead>
          {samples.map((s) => {
            const ls = shown.filter((l) => l.sampleCode === s.code);
            if (!ls.length) return null;
            const ids = ls.filter((l) => !locked(l)).map((l) => l.id);
            const allOn = ids.length > 0 && ids.every((id) => sel.has(id));
            return (
              <tbody key={s.code}>
                <tr className="bg-[#d9edf7]">
                  <td className="!border-t-[#bce8f1]"><input type="checkbox" aria-label={`Chọn các dòng của ${s.code}`} checked={allOn} disabled={!ids.length} onChange={() => toggle(ids, !allOn)} /></td>
                  <td colSpan={7} className="!border-t-[#bce8f1] font-bold">
                    {s.code}: {s.locationName}
                    {s.sampler && <span className="ml-2 text-xs font-normal text-[#31708f]">Người lấy mẫu: {s.sampler}</span>}
                  </td>
                </tr>
                {ls.map((l0) => {
                  const l = val(l0);
                  const ro = !canWrite || locked(l0);
                  return (
                    <tr key={l.id} className={sel.has(l.id) ? "bg-[#f5f5f5]" : undefined}>
                      <td><input type="checkbox" aria-label={`Chọn ${l.criterion}`} disabled={locked(l0)} checked={sel.has(l.id)} onChange={() => toggle([l.id], !sel.has(l.id))} /></td>
                      <td className="min-w-[12rem]">{l.criterion}{l.unit && <span className="text-muted-foreground"> ({l.unit})</span>}</td>
                      <td>
                        <select disabled={ro} value={l.lineKind || LINE_KINDS[0]} onChange={(e) => set(l.id, { lineKind: e.target.value })} aria-label={`Loại ${l.criterion}`} className={`${input} h-8 px-2`}>
                          {LINE_KINDS.map((k) => <option key={k}>{k}</option>)}
                        </select>
                      </td>
                      <td><input disabled={ro} list="assign-methods" value={l.method} onChange={(e) => set(l.id, { method: e.target.value })} aria-label={`Phương pháp ${l.criterion}`} className={`${input} h-8 min-w-[10rem]`} /></td>
                      <td><input disabled={ro} type="number" min={1} max={20} value={l.samplingTimes} onChange={(e) => set(l.id, { samplingTimes: Number(e.target.value) || 1 })} aria-label={`Số lần đo ${l.criterion}`} className={`${input} h-8 px-2`} /></td>
                      <td>
                        <select disabled={ro} value={l.analyst} onChange={(e) => set(l.id, { analyst: e.target.value })} aria-label={`Người phân tích ${l.criterion}`} className={`${input} h-8 px-2`}>
                          <option value="" />
                          {people(l.analyst).map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </td>
                      <td>
                        <select disabled={ro} value={l.subcontractor} onChange={(e) => set(l.id, { subcontractor: e.target.value })} aria-label={`Thầu phụ ${l.criterion}`} className={`${input} h-8 px-2`}>
                          <option value="" />
                          {scopes.map((x) => <option key={x}>{x}</option>)}
                          {l.subcontractor && !scopes.includes(l.subcontractor) && <option>{l.subcontractor}</option>}
                        </select>
                      </td>
                      <td className="whitespace-nowrap text-xs">{l.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
      {lines.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Đơn hàng chưa có chỉ tiêu – dùng Bóc tách để tạo.</p>}
    </div>
  );
}
