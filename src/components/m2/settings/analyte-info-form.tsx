"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btnPrimary, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { DECIMAL_BANDS, roundForPrint, type DecimalRules } from "@/lib/modules/m2/orders";
import type { LabAnalyte } from "@/lib/modules/m2/data/orders";

type Opt = { value: string; label: string };

/** Tab "Thông tin" của chỉ tiêu: tên khi in, viết tắt, đơn vị, hiện trường, công thức, nhóm, quy chuẩn mặc định, làm tròn khi in. */
export function AnalyteInfoForm({
  analyte,
  types,
  groups,
  formulas,
  specs,
  scopes,
  canWrite,
}: {
  analyte: LabAnalyte;
  types: Opt[];
  groups: string[];
  formulas: Opt[];
  specs: Opt[];
  scopes: string[];
  canWrite: boolean;
}) {
  const [f, setF] = useState({ ...analyte, decimals: analyte.decimals ?? {} });
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const set = (k: keyof LabAnalyte) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setDec = (k: keyof DecimalRules, v: string) =>
    setF((x) => ({ ...x, decimals: { ...x.decimals, [k]: v === "" ? undefined : Math.min(8, Math.max(0, Math.round(Number(v)))) } }));

  async function save() {
    if (!f.name.trim()) return toast.error("Nhập tên chỉ tiêu");
    setBusy(true);
    const decimals = Object.values(f.decimals).some((v) => v != null) ? f.decimals : null;
    const res = await fetch(`/api/lab-analytes/${analyte.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, decimals, unitPrice: Number(f.unitPrice) || 0, sort: Number(f.sort) || 0 }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không lưu được chỉ tiêu", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu chỉ tiêu");
    start(() => router.refresh());
  }

  const row = "grid gap-1 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center sm:gap-4";
  const label = "text-sm font-bold sm:text-right";
  const sel = (k: keyof LabAnalyte, opts: Opt[], empty = "— Không chọn —") => (
    <select value={String(f[k] ?? "")} onChange={set(k)} disabled={!canWrite} className={input}>
      <option value="">{empty}</option>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  const sample = [0.0569, 7.256, 56.78, 1234.5];
  return (
    <fieldset disabled={!canWrite} className="max-w-4xl space-y-3">
      <label className={row}><span className={label}>Tên *</span><input value={f.name} onChange={set("name")} className={input} /></label>
      <label className={row}><span className={label}>Tên khi in</span><input value={f.printName} onChange={set("printName")} placeholder="Trống = dùng tên ở trên" className={input} /></label>
      <label className={row}><span className={label}>Viết tắt</span><input value={f.abbreviation} onChange={set("abbreviation")} className={`${input} sm:max-w-xs`} /></label>
      <label className={row}><span className={label}>Loại mẫu</span>{sel("sampleTypeId", types, "— Chọn loại mẫu —")}</label>
      <label className={row}><span className={label}>Đơn vị</span><input value={f.unit} onChange={set("unit")} className={`${input} sm:max-w-xs`} /></label>
      <label className={row}>
        <span className={label}>Chỉ tiêu hiện trường</span>
        <span className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isField} onChange={(e) => setF((x) => ({ ...x, isField: e.target.checked }))} />Đo nhanh ngoài hiện trường (không mang về phòng thí nghiệm)</span>
      </label>
      <label className={row}><span className={label}>Ghi chú (in trên phiếu)</span><input value={f.note} onChange={set("note")} className={input} /></label>
      <label className={row}><span className={label}>Công thức tính</span>{sel("formulaCode", formulas)}</label>
      <label className={row}><span className={label}>Nhóm chỉ tiêu</span>{sel("groupName", groups.map((g) => ({ value: g, label: g })))}</label>
      <label className={row}><span className={label}>Ngành công nghiệp</span><input value={f.industry} onChange={set("industry")} placeholder="Chỉ dùng cho chỉ tiêu ánh sáng" className={input} /></label>
      <label className={row}><span className={label}>Quy chuẩn mặc định 1</span>{sel("spec1Id", specs)}</label>
      <label className={row}><span className={label}>Quy chuẩn mặc định 2</span>{sel("spec2Id", specs)}</label>
      <div className={row}>
        <span className={label}>Phần thập phân khi in</span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {DECIMAL_BANDS.map((b) => (
            <label key={b.key} className="text-xs">
              <span className="mb-0.5 block text-muted-foreground">KQ {b.label}</span>
              <input inputMode="numeric" value={f.decimals[b.key] ?? ""} onChange={(e) => setDec(b.key, e.target.value)} className={`${input} h-8 px-2`} aria-label={`Số chữ số thập phân khi kết quả ${b.label}`} />
            </label>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground sm:ml-[14rem]">Ví dụ in: {sample.map((v) => `${v.toLocaleString("vi-VN")} → ${roundForPrint(v, f.decimals)}`).join(" · ")}</p>
      <label className={row}><span className={label}>Thứ tự trên phiếu</span><input inputMode="numeric" value={f.sort} onChange={set("sort")} className={`${input} sm:max-w-[8rem]`} /></label>
      <label className={row}><span className={label}>Phạm vi thực hiện</span>{sel("scope", scopes.map((s) => ({ value: s, label: s })))}</label>
      <label className={row}><span className={label}>Giới hạn định lượng (LOQ)</span><input value={f.loq} onChange={set("loq")} className={`${input} sm:max-w-xs`} /></label>
      <label className={row}><span className={label}>Đơn giá tham khảo (đ)</span><input inputMode="numeric" value={f.unitPrice || ""} onChange={set("unitPrice")} className={`${input} sm:max-w-xs`} /></label>
      <label className={row}>
        <span className={label}>Đang dùng</span>
        <span className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF((x) => ({ ...x, active: e.target.checked }))} />Hiện khi bóc tách</span>
      </label>
      {canWrite && (
        <div className="sm:ml-[14rem]">
          <button type="button" disabled={busy} onClick={save} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
        </div>
      )}
    </fieldset>
  );
}
