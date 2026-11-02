"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { btn, btnPrimary, btnXs, input, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { PLAN_ITEM_KINDS } from "@/lib/modules/m2/orders";
import type { OrderPlan, PlanItem } from "@/lib/modules/m2/data/order-extras";
import { vnDateOf } from "@/lib/platform/dates";

type Item = { kind: string; name: string; quantity: string; note: string };

/** Kế hoạch quan trắc của đơn: nhân sự đoàn (trưởng đoàn, giám sát, phó đoàn, các nhóm), thời gian và thiết bị / vật tư – hóa chất / bảo quản. */
export function PlanEditor({
  orderId,
  plan,
  items: initialItems,
  staff,
  catalog,
  canWrite,
}: {
  orderId: string;
  plan: OrderPlan | null;
  items: PlanItem[];
  staff: string[];
  /** Lựa chọn sẵn cho từng loại (thiết bị quan trắc, dụng cụ chứa, cách bảo quản). */
  catalog: Record<string, string[]>;
  canWrite: boolean;
}) {
  const [f, setF] = useState({
    leader: plan?.leader ?? "",
    supervisor: plan?.supervisor ?? "",
    deputy1: plan?.deputy1 ?? "",
    deputy2: plan?.deputy2 ?? "",
    startAt: vnDateOf(plan?.startAt),
    endAt: vnDateOf(plan?.endAt),
    vehicle: plan?.vehicle ?? "",
    note: plan?.note ?? "",
  });
  const [groups, setGroups] = useState<string[][]>(plan?.groups?.length ? plan.groups : []);
  const [items, setItems] = useState<Item[]>(initialItems.map((i) => ({ kind: i.kind, name: i.name, quantity: i.quantity, note: i.note })));
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const person = (k: "leader" | "supervisor" | "deputy1" | "deputy2", label: string) => (
    <label className="text-sm">
      <span className="mb-1 block font-bold">{label}</span>
      <select value={f[k]} onChange={set(k)} className={input}>
        <option value="" />
        {staff.map((s) => <option key={s}>{s}</option>)}
        {f[k] && !staff.includes(f[k]) && <option>{f[k]}</option>}
      </select>
    </label>
  );

  const setMember = (gi: number, k: number, v: string) =>
    setGroups((gs) => gs.map((g, j) => (j === gi ? Array.from({ length: 4 }, (_, n) => (n === k ? v : (g[n] ?? ""))) : g)));
  const setItem = (i: number, k: keyof Item, v: string) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  async function suggest() {
    setBusy("suggest");
    const res = await fetch(`/api/orders/${orderId}/plan`);
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lấy được gợi ý", b.error ?? `HTTP ${res.status}`);
    const have = new Set(items.map((i) => `${i.kind}|${i.name.toLowerCase()}`));
    const fresh = (b.items as Item[]).filter((i) => !have.has(`${i.kind}|${i.name.toLowerCase()}`));
    if (!fresh.length) return toast.error("Không có gợi ý mới", "Gắn thiết bị / dụng cụ / bảo quản cho chỉ tiêu ở Cài đặt → Chỉ tiêu");
    setItems((xs) => [...xs, ...fresh]);
    toast.success(`Đã thêm ${fresh.length} dòng gợi ý – kiểm tra số lượng rồi Lưu`);
  }

  async function save() {
    setBusy("save");
    const res = await fetch(`/api/orders/${orderId}/plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: { ...f, groups }, items }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được kế hoạch", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu kế hoạch quan trắc");
    start(() => router.refresh());
  }

  return (
    <fieldset disabled={!canWrite} className="space-y-6">
      <section>
        <h2 className="mb-2 border-b border-[#ddd] pb-1 text-lg font-medium">Nhân sự quan trắc</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {person("leader", "Trưởng đoàn")}
          {person("supervisor", "Giám sát")}
          {person("deputy1", "Phó đoàn 1")}
          {person("deputy2", "Phó đoàn 2")}
        </div>
        <div className="mt-3 space-y-2">
          {groups.map((g, gi) => (
            <div key={gi} className="rounded border border-[#ddd] p-2">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold">
                Nhóm {gi + 1}
                {canWrite && <button type="button" onClick={() => setGroups((gs) => gs.filter((_, j) => j !== gi))} className={btnXs}><Trash2 className="h-3 w-3" aria-hidden />Xóa nhóm</button>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((k) => (
                  <select
                    key={k}
                    value={g[k] ?? ""}
                    onChange={(e) => setMember(gi, k, e.target.value)}
                    aria-label={`Nhóm ${gi + 1} – người ${k + 1}`}
                    className={input}
                  >
                    <option value="">{k === 0 ? "Nhóm trưởng" : `Thành viên ${k + 1}`}</option>
                    {staff.map((s) => <option key={s}>{s}</option>)}
                    {g[k] && !staff.includes(g[k]) && <option>{g[k]}</option>}
                  </select>
                ))}
              </div>
            </div>
          ))}
          {canWrite && <button type="button" onClick={() => setGroups((gs) => [...gs, ["", "", "", ""]])} className={btn}>Thêm nhóm <Plus className="h-4 w-4" /></button>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 border-b border-[#ddd] pb-1 text-lg font-medium">Thời gian và phương tiện</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm"><span className="mb-1 block font-bold">Ngày đi</span><input type="date" value={f.startAt} onChange={set("startAt")} className={input} /></label>
          <label className="text-sm"><span className="mb-1 block font-bold">Ngày về</span><input type="date" value={f.endAt} onChange={set("endAt")} className={input} /></label>
          <label className="text-sm lg:col-span-2"><span className="mb-1 block font-bold">Phương tiện</span><input value={f.vehicle} onChange={set("vehicle")} placeholder="VD: xe 36A-123.45" className={input} /></label>
          <label className="text-sm sm:col-span-2 lg:col-span-4"><span className="mb-1 block font-bold">Ghi chú</span><input value={f.note} onChange={set("note")} className={input} /></label>
        </div>
      </section>

      {PLAN_ITEM_KINDS.map((kind) => {
        const rows = items.map((it, i) => ({ it, i })).filter((x) => x.it.kind === kind);
        return (
          <section key={kind} id={kind === "Bảo quản" ? "bao-quan" : kind === "Thiết bị" ? "thiet-bi" : "vat-tu"}>
            <h2 className="mb-2 flex flex-wrap items-center gap-2 border-b border-[#ddd] pb-1 text-lg font-medium">
              {kind}
              {canWrite && <button type="button" onClick={() => setItems((xs) => [...xs, { kind, name: "", quantity: "", note: "" }])} className={btnXs}><Plus className="h-3 w-3" aria-hidden />Thêm dòng</button>}
            </h2>
            <datalist id={`plan-${kind}`}>{(catalog[kind] ?? []).map((n) => <option key={n} value={n} />)}</datalist>
            <div className="overflow-x-auto">
              <table className={table}>
                <thead><tr><th className="w-8">#</th><th>Tên</th><th className="w-32">Số lượng</th><th>Ghi chú</th><th className="w-12" /></tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={5} className="py-3 text-center text-muted-foreground">Chưa có</td></tr>}
                  {rows.map(({ it, i }, n) => (
                    <tr key={i}>
                      <td>{n + 1}</td>
                      <td><input list={`plan-${kind}`} value={it.name} onChange={(e) => setItem(i, "name", e.target.value)} aria-label={`${kind} ${n + 1}`} className={`${input} h-8`} /></td>
                      <td><input value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} aria-label={`Số lượng ${n + 1}`} className={`${input} h-8`} /></td>
                      <td><input value={it.note} onChange={(e) => setItem(i, "note", e.target.value)} aria-label={`Ghi chú ${n + 1}`} className={`${input} h-8`} /></td>
                      <td>{canWrite && <button type="button" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} className={btnXs} aria-label="Xóa dòng"><Trash2 className="h-3 w-3" /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {canWrite && (
        <div className="flex flex-wrap gap-1.5">
          <button type="button" disabled={Boolean(busy)} onClick={save} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu kế hoạch</button>
          <button type="button" disabled={Boolean(busy)} onClick={suggest} className={btn}>{busy === "suggest" && <Loader2 className="h-4 w-4 animate-spin" />}Gợi ý từ chỉ tiêu của đơn</button>
        </div>
      )}
    </fieldset>
  );
}
