"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { btn, btnPrimary, input, link, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { ANALYTE_SCOPES, specLabel } from "@/lib/modules/m2/orders";
import type { LabAnalyte, SampleType, Specification } from "@/lib/modules/m2/data/orders";

type Line = { key: string; name: string; unit: string; method: string; subcontractor: string };

/**
 * Bảng bóc tách: vị trí / tên mẫu, loại mẫu, số mẫu, mẫu QA/QC – mẫu lặp, quy chuẩn so sánh
 * và danh sách chỉ tiêu (chọn từ danh mục theo loại mẫu hoặc gõ chỉ tiêu mới) → "Tạo yêu cầu".
 */
export function SplitForm({
  orderId,
  types,
  analytes,
  specs,
  locations,
}: {
  orderId: string;
  types: SampleType[];
  analytes: LabAnalyte[];
  specs: Specification[];
  locations: string[];
}) {
  const router = useRouter();
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [location, setLocation] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [count, setCount] = useState("1");
  const [isQc, setIsQc] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [specId, setSpecId] = useState("");
  const [group, setGroup] = useState("");
  const [pick, setPick] = useState("");
  const [newName, setNewName] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string[]>([]);

  const ofType = useMemo(() => analytes.filter((a) => a.sampleTypeId === typeId && a.active).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)), [analytes, typeId]);
  const groups = [...new Set(ofType.map((a) => a.groupName).filter(Boolean))];
  const choices = ofType.filter((a) => (!group || a.groupName === group) && !lines.some((l) => l.name === a.name));
  const typeSpecs = specs.filter((s) => s.active && (!s.sampleTypeId || s.sampleTypeId === typeId));
  const toLine = (a: LabAnalyte): Line => ({ key: a.id, name: a.name, unit: a.unit, method: a.method, subcontractor: a.scope || "VILAS" });

  function changeType(id: string) {
    setTypeId(id);
    setLines([]);
    setGroup("");
    setPick("");
    setSpecId("");
  }
  function add() {
    const a = ofType.find((x) => x.id === pick);
    if (!a) return toast.error("Chọn chỉ tiêu cần thêm");
    setLines((l) => [...l, toLine(a)]);
    setPick("");
  }
  function addNew() {
    const name = newName.trim();
    if (!name) return toast.error("Gõ tên chỉ tiêu mới");
    if (lines.some((l) => l.name === name)) return toast.error("Chỉ tiêu đã có trong bảng");
    setLines((l) => [...l, { key: `new-${Date.now()}`, name, unit: "", method: "", subcontractor: "Nội bộ" }]);
    setNewName("");
  }
  const edit = (key: string, k: keyof Line) => (e: { target: { value: string } }) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, [k]: e.target.value } : l)));

  async function create() {
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/split`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sampleTypeId: typeId, locationName: location, customerSampleCode: customerCode, count: Number(count), isQc, isDuplicate, specId, lines }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không tạo được yêu cầu", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã tạo ${b.samples} yêu cầu`, (b.codes as string[]).join(", "));
    setLast(b.codes);
    setLocation("");
    setCustomerCode("");
    setCount("1");
    router.refresh();
  }

  const label = "text-sm font-bold text-[#3c763d]";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded border border-[#d6e9c6] bg-[#dff0d8] p-4 md:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
        <label htmlFor="loc" className={label}>Vị trí/tên mẫu</label>
        <div>
          <input id="loc" list="split-locations" value={location} onChange={(e) => setLocation(e.target.value)} className={input} placeholder="VD: Ruộng số 3 # Điểm lấy mẫu A" />
          <datalist id="split-locations">{locations.map((l) => <option key={l} value={l} />)}</datalist>
        </div>
        <label htmlFor="type" className={label}>Loại mẫu</label>
        <select id="type" value={typeId} onChange={(e) => changeType(e.target.value)} className={input}>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.prefix})</option>)}
        </select>
        <p className="text-xs italic text-[#3c763d] md:col-span-4">
          – Phân cấp bằng dấu # từ lớn đến bé, VD: Xã Đông Tiến # Thôn 3 # Ruộng ông A. – Gõ vài chữ để chọn lại vị trí đã dùng trong đơn.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[10rem_minmax(0,22rem)_auto] md:items-center">
        <label htmlFor="cc" className="text-sm font-bold md:text-right">Mã mẫu của khách</label>
        <input id="cc" value={customerCode} onChange={(e) => setCustomerCode(e.target.value)} className={input} />
        <div className="flex flex-wrap gap-5 text-sm font-bold">
          <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={isQc} onChange={(e) => setIsQc(e.target.checked)} />Mẫu QA/QC</label>
          <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={isDuplicate} onChange={(e) => setIsDuplicate(e.target.checked)} />Mẫu lặp</label>
        </div>
        <label htmlFor="cnt" className="text-sm font-bold md:text-right">Số mẫu</label>
        <input id="cnt" type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} className={`${input} max-w-[7rem]`} />
        <span className="text-xs text-muted-foreground">Mỗi mẫu một mã riêng, cùng danh sách chỉ tiêu</span>
        <label htmlFor="spec" className="text-sm font-bold md:text-right">Quy chuẩn so sánh</label>
        <select id="spec" value={specId} onChange={(e) => setSpecId(e.target.value)} className={input}>
          <option value="">— Không so sánh quy chuẩn —</option>
          {typeSpecs.map((s) => <option key={s.id} value={s.id}>{specLabel(s)}</option>)}
        </select>
        <Link href="/specifications" className={`${link} text-xs`}>Danh mục quy chuẩn</Link>
      </div>

      <div className="flex gap-1">
        <button type="button" className={btn} onClick={() => setLines((l) => [...l, ...ofType.filter((a) => !l.some((x) => x.name === a.name)).map(toLine)])}>Chọn hết</button>
        <button type="button" className={btn} onClick={() => setLines([])}>Bỏ chọn hết</button>
      </div>

      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr><th className="w-8">#</th><th>Chỉ tiêu</th><th className="w-28">Đơn vị</th><th className="w-36">Thầu phụ</th><th>Phương pháp</th><th className="w-8" /></tr>
          </thead>
          <tbody>
            {lines.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Chưa có chỉ tiêu – chọn ở dòng bên dưới</td></tr>}
            {lines.map((l, i) => (
              <tr key={l.key}>
                <td>{i + 1}</td>
                <td>{l.name}</td>
                <td><input value={l.unit} onChange={edit(l.key, "unit")} className={`${input} h-8`} aria-label={`Đơn vị ${l.name}`} /></td>
                <td>
                  <select value={l.subcontractor} onChange={edit(l.key, "subcontractor")} className={`${input} h-8 px-2`} aria-label={`Thầu phụ ${l.name}`}>
                    {ANALYTE_SCOPES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td><input value={l.method} onChange={edit(l.key, "method")} className={`${input} h-8`} aria-label={`Phương pháp ${l.name}`} /></td>
                <td><button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} aria-label={`Bỏ ${l.name}`} className="text-[#a94442]"><X className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 border-y border-[#e5e5e5] py-4 lg:grid-cols-[auto_14rem_auto_minmax(0,1fr)_auto] lg:items-center">
        <span className="text-sm font-bold">Nhóm</span>
        <select value={group} onChange={(e) => setGroup(e.target.value)} className={input}>
          <option value="">— Tất cả các nhóm chỉ tiêu —</option>
          {groups.map((g) => <option key={g}>{g}</option>)}
        </select>
        <span className="text-sm font-bold">Chỉ tiêu</span>
        <select value={pick} onChange={(e) => setPick(e.target.value)} className={input}>
          <option value="">— Chọn chỉ tiêu ({choices.length}) —</option>
          {choices.map((a) => <option key={a.id} value={a.id}>{a.accreditedNo ? `${String(a.accreditedNo).padStart(2, "0")}. ` : ""}{a.name}</option>)}
        </select>
        <div className="flex gap-1">
          <button type="button" onClick={add} className="inline-flex h-[34px] items-center rounded border border-[#4cae4c] bg-[#5cb85c] px-3 text-sm text-white hover:bg-[#449d44]">Thêm</button>
          <button type="button" onClick={() => setLines((l) => [...l, ...choices.map(toLine)])} className={btnPrimary}>Thêm tất cả</button>
        </div>
        <span className="text-sm font-bold">Chỉ tiêu mới</span>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNew())} className={`${input} lg:col-span-3`} placeholder="Chỉ tiêu không có trong danh mục (khách yêu cầu)" />
        <button type="button" onClick={addNew} className="inline-flex h-[34px] items-center rounded border border-[#d43f3a] bg-[#d9534f] px-3 text-sm text-white hover:bg-[#c9302c]">Chỉ tiêu mới</button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={`/orders/${orderId}`} className={btn} aria-label="Quay lại đơn hàng"><ArrowLeft className="h-4 w-4" /></Link>
        <button type="button" disabled={busy || !lines.length || !location.trim()} onClick={create} className={btnPrimary}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}Tạo yêu cầu
        </button>
        <Link href={`/orders/${orderId}/samples`} className={btn}>Xem yêu cầu của đơn hàng</Link>
        {last.length > 0 && <span className="text-sm text-[#3c763d]">Vừa tạo: {last.join(", ")}</span>}
      </div>
    </div>
  );
}
