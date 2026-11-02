"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LocateFixed, Trash2 } from "lucide-react";
import { btn, btnPrimary, btnXs, input, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { ENV_FIELDS, LINE_KINDS, type EnvConditions } from "@/lib/modules/m2/orders";
import type { OrderLine, OrderSample } from "@/lib/modules/m2/data/orders";
import { fromLocalInputVN, toLocalInputVN, vnDateOf } from "@/lib/platform/dates";

type Opt = { value: string; label: string };
type Point = { id: string; name: string; lat: number | null; lng: number | null };

const row = "grid gap-1 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center sm:gap-4";
const label = "text-sm font-bold sm:text-right";

async function patchSample(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/order-samples/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const b = await res.json().catch(() => ({}));
  if (!res.ok) toast.error("Không lưu được yêu cầu", b.error ?? `HTTP ${res.status}`);
  else toast.success("Đã lưu yêu cầu");
  return res.ok;
}

function SaveBar({ busy, onSave }: { busy: boolean; onSave: () => void }) {
  return (
    <div className="sm:ml-[14rem]">
      <button type="button" disabled={busy} onClick={onSave} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
    </div>
  );
}

/** Tab "Thông tin": vị trí, mã của khách, vị trí quan trắc, các mốc ngày, QA/QC. */
export function SampleInfoForm({ sample, points, canWrite }: { sample: OrderSample; points: Point[]; canWrite: boolean }) {
  const [f, setF] = useState({
    locationName: sample.locationName,
    customerSampleCode: sample.customerSampleCode,
    pointId: sample.pointId,
    receivedAt: vnDateOf(sample.receivedAt),
    dueAt: vnDateOf(sample.dueAt),
    disposeAt: vnDateOf(sample.disposeAt),
    isQc: sample.isQc,
    isDuplicate: sample.isDuplicate,
  });
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function save() {
    if (!f.locationName.trim()) return toast.error("Nhập vị trí / tên mẫu");
    setBusy(true);
    const ok = await patchSample(sample.id, f);
    setBusy(false);
    if (ok) start(() => router.refresh());
  }
  return (
    <fieldset disabled={!canWrite} className="max-w-4xl space-y-3">
      <div className={row}><span className={label}>Mã yêu cầu</span><span className="font-mono text-sm">{sample.code}</span></div>
      <div className={row}><span className={label}>Loại mẫu</span><span className="text-sm">{sample.type}</span></div>
      <label className={row}><span className={label}>Vị trí / tên mẫu *</span><input value={f.locationName} onChange={set("locationName")} className={input} /></label>
      <label className={row}><span className={label}>Mã mẫu của khách</span><input value={f.customerSampleCode} onChange={set("customerSampleCode")} className={`${input} sm:max-w-xs`} /></label>
      <label className={row}>
        <span className={label}>Vị trí quan trắc</span>
        <select value={f.pointId} onChange={set("pointId")} className={input}>
          <option value="">— Không chọn —</option>
          {points.map((p) => <option key={p.id} value={p.id}>{p.name}{p.lat != null && p.lng != null ? ` (${p.lat}, ${p.lng})` : ""}</option>)}
        </select>
      </label>
      <label className={row}><span className={label}>Ngày nhận mẫu</span><input type="date" value={f.receivedAt} onChange={set("receivedAt")} className={`${input} sm:max-w-[12rem]`} /></label>
      <label className={row}><span className={label}>Hạn trả kết quả</span><input type="date" value={f.dueAt} onChange={set("dueAt")} className={`${input} sm:max-w-[12rem]`} /></label>
      <label className={row}><span className={label}>Ngày hủy mẫu</span><input type="date" value={f.disposeAt} onChange={set("disposeAt")} className={`${input} sm:max-w-[12rem]`} /></label>
      <div className={row}>
        <span className={label}>Loại yêu cầu</span>
        <span className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.isQc} onChange={(e) => setF((x) => ({ ...x, isQc: e.target.checked }))} />Mẫu QA/QC</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.isDuplicate} onChange={(e) => setF((x) => ({ ...x, isDuplicate: e.target.checked }))} />Mẫu lặp</label>
        </span>
      </div>
      {canWrite && <SaveBar busy={busy} onSave={save} />}
    </fieldset>
  );
}

/** Tab "Quy chuẩn": tối đa 2 cột quy chuẩn so sánh, in trên phiếu kết quả. */
export function SampleSpecForm({ sample, specs, canWrite }: { sample: OrderSample; specs: Opt[]; canWrite: boolean }) {
  const [f, setF] = useState({ specId: sample.specId, spec2Id: sample.spec2Id });
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  async function save() {
    if (f.specId && f.specId === f.spec2Id) return toast.error("Hai cột quy chuẩn trùng nhau");
    setBusy(true);
    const ok = await patchSample(sample.id, f);
    setBusy(false);
    if (ok) start(() => router.refresh());
  }
  const sel = (k: keyof typeof f, empty: string) => (
    <select value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} className={input}>
      <option value="">{empty}</option>
      {specs.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  return (
    <fieldset disabled={!canWrite} className="max-w-4xl space-y-3">
      <label className={row}><span className={label}>Cột quy chuẩn 1</span>{sel("specId", "— Không so sánh —")}</label>
      <label className={row}><span className={label}>Cột quy chuẩn 2</span>{sel("spec2Id", "— Không —")}</label>
      {canWrite && <SaveBar busy={busy} onSave={save} />}
    </fieldset>
  );
}

/** Tab "Người lấy mẫu": người lấy mẫu, thời điểm, tình trạng, lượng mẫu, tọa độ và điều kiện môi trường khi lấy mẫu. */
export function SampleFieldForm({ sample, staff, team, point, canWrite }: { sample: OrderSample; staff: string[]; team: string[]; point: Point | null; canWrite: boolean }) {
  const [samplers, setSamplers] = useState<string[]>(sample.sampler ? sample.sampler.split(",").map((s) => s.trim()).filter(Boolean) : []);
  const [f, setF] = useState({
    sampledAt: toLocalInputVN(sample.sampledAt),
    sampleCondition: sample.sampleCondition,
    sampleQuantity: sample.sampleQuantity,
    lat: sample.lat == null ? "" : String(sample.lat),
    lng: sample.lng == null ? "" : String(sample.lng),
  });
  const [env, setEnv] = useState<EnvConditions>(sample.envConditions ?? {});
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  // Ưu tiên người trong đoàn quan trắc của đơn, sau đó toàn bộ nhân sự.
  const people = [...new Set([...team, ...staff, ...samplers])];
  const coord = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

  function here() {
    if (!navigator.geolocation) return toast.error("Trình duyệt không hỗ trợ định vị");
    navigator.geolocation.getCurrentPosition(
      (p) => setF((x) => ({ ...x, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) })),
      (e) => toast.error("Không lấy được vị trí", e.message),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function save() {
    const lat = coord(f.lat);
    const lng = coord(f.lng);
    if ((lat !== null && !Number.isFinite(lat)) || (lng !== null && !Number.isFinite(lng))) return toast.error("Tọa độ phải là số", "VD vĩ độ 19,8076 – kinh độ 105,7764");
    setBusy(true);
    const ok = await patchSample(sample.id, {
      sampler: samplers.join(", "),
      sampledAt: fromLocalInputVN(f.sampledAt),
      sampleCondition: f.sampleCondition,
      sampleQuantity: f.sampleQuantity,
      lat,
      lng,
      envConditions: Object.fromEntries(Object.entries(env).filter(([, v]) => String(v ?? "").trim())),
    });
    setBusy(false);
    if (ok) start(() => router.refresh());
  }

  return (
    <fieldset disabled={!canWrite} className="max-w-4xl space-y-3">
      <div className={row}>
        <span className={label}>Người lấy mẫu</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 rounded border border-[#ddd] p-2 text-sm">
          {people.length === 0 && <span className="text-muted-foreground">Chưa có nhân sự – thêm ở Nhân sự hoặc Kế hoạch quan trắc của đơn</span>}
          {people.map((p) => (
            <label key={p} className="flex items-center gap-1.5">
              <input type="checkbox" checked={samplers.includes(p)} onChange={(e) => setSamplers((s) => (e.target.checked ? [...s, p] : s.filter((x) => x !== p)))} />
              {p}
              {team.includes(p) && <span className="text-[11px] text-muted-foreground">(đoàn)</span>}
            </label>
          ))}
        </div>
      </div>
      <label className={row}><span className={label}>Thời gian lấy mẫu</span><input type="datetime-local" value={f.sampledAt} onChange={set("sampledAt")} className={`${input} sm:max-w-[16rem]`} /></label>
      <label className={row}><span className={label}>Tình trạng mẫu</span><input value={f.sampleCondition} onChange={set("sampleCondition")} placeholder="VD: mẫu trong, không mùi, niêm phong nguyên vẹn" className={input} /></label>
      <label className={row}><span className={label}>Lượng mẫu</span><input value={f.sampleQuantity} onChange={set("sampleQuantity")} placeholder="VD: 2 lít, 500 g" className={`${input} sm:max-w-xs`} /></label>
      <div className={row}>
        <span className={label}>Vĩ độ / kinh độ</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <input value={f.lat} onChange={set("lat")} inputMode="decimal" placeholder="Vĩ độ" aria-label="Vĩ độ" className={`${input} !w-36`} />
          <input value={f.lng} onChange={set("lng")} inputMode="decimal" placeholder="Kinh độ" aria-label="Kinh độ" className={`${input} !w-36`} />
          {canWrite && <button type="button" onClick={here} className={btn}><LocateFixed className="h-4 w-4" aria-hidden />Vị trí hiện tại</button>}
          {canWrite && point && point.lat != null && point.lng != null && (
            <button type="button" onClick={() => setF((x) => ({ ...x, lat: String(point.lat), lng: String(point.lng) }))} className={btn}>Lấy theo “{point.name}”</button>
          )}
          {f.lat && f.lng && (
            <a href={`https://www.google.com/maps?q=${encodeURIComponent(`${f.lat},${f.lng}`)}`} target="_blank" rel="noreferrer noopener" className="text-sm text-[#337ab7] hover:underline">Xem bản đồ</a>
          )}
        </div>
      </div>
      <div className={row}>
        <span className={label}>Điều kiện môi trường</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {ENV_FIELDS.map((e) => (
            <label key={e.key} className={e.key === "note" ? "text-xs sm:col-span-3" : "text-xs"}>
              <span className="mb-0.5 block text-muted-foreground">{e.label}</span>
              <input value={env[e.key] ?? ""} onChange={(ev) => setEnv((x) => ({ ...x, [e.key]: ev.target.value }))} className={`${input} h-8 px-2`} />
            </label>
          ))}
        </div>
      </div>
      {canWrite && <SaveBar busy={busy} onSave={save} />}
    </fieldset>
  );
}

type Analyte = { name: string; unit: string; method: string; isField: boolean; group: string };

/** Tab "Chỉ tiêu": danh sách chỉ tiêu của yêu cầu, thêm chỉ tiêu theo loại mẫu, bớt chỉ tiêu chưa có kết quả. */
export function SampleLines({ sampleId, lines, analytes, canWrite }: { sampleId: string; lines: OrderLine[]; analytes: Analyte[]; canWrite: boolean }) {
  const [pick, setPick] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const have = new Set(lines.map((l) => l.criterion.toLowerCase()));
  const free = analytes.filter((a) => !have.has(a.name.toLowerCase()) && (!q || a.name.toLowerCase().includes(q.toLowerCase())));

  async function add() {
    const items = analytes.filter((a) => pick.has(a.name)).map((a) => ({ name: a.name, unit: a.unit, method: a.method, lineKind: a.isField ? LINE_KINDS[1] : LINE_KINDS[0] }));
    if (!items.length) return toast.error("Chưa chọn chỉ tiêu");
    setBusy(true);
    const res = await fetch(`/api/order-samples/${sampleId}/lines`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không thêm được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã thêm ${b.added} chỉ tiêu`);
    setPick(new Set());
    start(() => router.refresh());
  }

  async function remove(l: OrderLine) {
    if (!confirm(`Bớt chỉ tiêu "${l.criterion}" khỏi yêu cầu?`)) return;
    const res = await fetch(`/api/order-samples/${sampleId}/lines?lineId=${l.id}`, { method: "DELETE" });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không bớt được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã bớt ${l.criterion}`);
    start(() => router.refresh());
  }

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr><th className="w-8">#</th><th>Chỉ tiêu</th><th>Đơn vị</th><th>Phương pháp</th><th>Loại</th><th>Số lần đo</th><th>Người phân tích</th><th>Thầu phụ</th><th>Kết quả</th><th>Trạng thái</th><th /></tr>
          </thead>
          <tbody>
            {lines.length === 0 && <tr><td colSpan={11} className="py-6 text-center text-muted-foreground">Chưa có chỉ tiêu</td></tr>}
            {lines.map((l, i) => {
              const empty = l.status === "Đang nhập" && !Number.isFinite(l.mean) && !l.prefix;
              return (
                <tr key={l.id}>
                  <td>{i + 1}</td>
                  <td>{l.criterion}</td>
                  <td>{l.unit || "-"}</td>
                  <td className="text-xs">{l.method || "—"}</td>
                  <td className="whitespace-nowrap">{l.lineKind || "Phòng TN"}</td>
                  <td>{l.samplingTimes}</td>
                  <td>{l.analyst || "—"}</td>
                  <td>{l.subcontractor || "—"}</td>
                  <td className="whitespace-nowrap">{l.prefix === "KPH" ? "KPH" : Number.isFinite(l.mean) ? `${l.prefix}${String(l.mean).replace(".", ",")}` : "—"}</td>
                  <td className="whitespace-nowrap">{l.status}</td>
                  <td>
                    {canWrite && empty && (
                      <button type="button" onClick={() => remove(l)} className={btnXs} aria-label={`Bớt ${l.criterion}`}><Trash2 className="h-3 w-3" aria-hidden />Bớt</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canWrite && (
        <div className="rounded border border-[#ddd] p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold">Thêm chỉ tiêu</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm chỉ tiêu…" className={`${input} !w-60`} />
            <button type="button" disabled={busy || !pick.size} onClick={add} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Thêm {pick.size ? `(${pick.size})` : ""}</button>
          </div>
          <div className="mt-2 grid max-h-72 gap-x-4 gap-y-1 overflow-y-auto text-sm sm:grid-cols-2 lg:grid-cols-3">
            {free.length === 0 && <span className="text-muted-foreground">Không còn chỉ tiêu nào của loại mẫu này để thêm</span>}
            {free.map((a) => (
              <label key={a.name} className="flex items-start gap-1.5">
                <input type="checkbox" className="mt-1" checked={pick.has(a.name)} onChange={(e) => setPick((s) => { const n = new Set(s); if (e.target.checked) n.add(a.name); else n.delete(a.name); return n; })} />
                <span>{a.name}{a.unit && <span className="text-muted-foreground"> ({a.unit})</span>}{a.isField && <span className="ml-1 text-[11px] text-[#8a6d3b]">hiện trường</span>}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
