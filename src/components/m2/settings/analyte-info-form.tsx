"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XSaveBar } from "@/components/m2/lab-ui/x-save";
import { SymbolInput } from "@/components/m2/lab-ui/symbol-input";
import { input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { DECIMAL_BANDS, type DecimalRules } from "@/lib/modules/m2/orders";
import type { LabAnalyte } from "@/lib/modules/m2/data/orders";

type Opt = { value: string; label: string };
type Spec = Opt & { sampleTypeId: string };
type Form = Omit<LabAnalyte, "id" | "decimals"> & { decimals: DecimalRules };

/**
 * Tab "Thông tin" của chỉ tiêu như XaLab: cột trái tên / đơn vị / loại mẫu / nhóm / quy chuẩn / thứ tự / phương pháp lấy mẫu,
 * cột phải ngành công nghiệp và số chữ số thập phân theo khoảng kết quả; dưới cùng các trường riêng của Viện (phạm vi, LOQ, đơn giá).
 * Thêm mới (`id` trống) thì chọn kèm phương pháp phân tích mặc định.
 */
export function AnalyteInfoForm({
  id,
  analyte,
  types,
  groups,
  formulas,
  specs,
  scopes,
  industries,
  methods,
  canWrite,
}: {
  id?: string;
  analyte: Form;
  types: Opt[];
  groups: string[];
  formulas: Opt[];
  specs: Spec[];
  scopes: string[];
  industries: string[];
  methods: string[];
  canWrite: boolean;
}) {
  const [f, setF] = useState<Form>(analyte);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const setDec = (k: keyof DecimalRules, v: string) => setF((x) => ({ ...x, decimals: { ...x.decimals, [k]: v === "" ? undefined : Math.min(8, Math.max(0, Math.round(Number(v)))) } }));

  async function save(exit: boolean) {
    if (!f.name.trim()) return toast.error("Nhập tên chỉ tiêu");
    if (!f.sampleTypeId) return toast.error("Chọn loại mẫu");
    setBusy(exit ? "exit" : "save");
    const decimals = Object.values(f.decimals).some((v) => v != null) ? f.decimals : null;
    const res = await fetch(id ? `/api/lab-analytes/${id}` : "/api/lab-analytes", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, decimals, unitPrice: Number(f.unitPrice) || 0, sort: Number(f.sort) || 0, accreditedNo: f.accreditedNo === null || String(f.accreditedNo) === "" ? null : Number(f.accreditedNo) }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được chỉ tiêu", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu chỉ tiêu");
    if (exit) return start(() => router.push("/lab-analytes"));
    if (!id && b.item?.id) return start(() => router.replace(`/lab-analytes/${b.item.id}`));
    start(() => router.refresh());
  }

  const row = "grid items-center gap-1 sm:grid-cols-[165px_minmax(0,1fr)] sm:gap-x-[30px]";
  // Cột phải XaLab có nhãn dài ("Phần thập phân với kết quả < 1000") nên rộng hơn.
  const rowR = "grid items-center gap-1 sm:grid-cols-[235px_minmax(0,1fr)] sm:gap-x-[30px]";
  const label = "text-sm font-bold text-[#333] sm:text-right";
  const sel = (k: keyof Form, opts: Opt[], empty = "") => (
    <select value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} className={input} aria-label={String(k)}>
      <option value="">{empty}</option>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      {f[k] && !opts.some((o) => o.value === f[k]) ? <option value={String(f[k])}>{String(f[k])}</option> : null}
    </select>
  );
  const text = (k: keyof Form, l: string) => (
    <div className={row}><span className={label}>{l}</span><SymbolInput label={l} value={String(f[k] ?? "")} onChange={(v) => set(k, v as never)} disabled={!canWrite} /></div>
  );
  const check = (k: "isField" | "noKFactor" | "notInQuote" | "allocatedCost" | "active", l: string, r = row) => (
    <label className={r}><span className={label}>{l}</span><span><input type="checkbox" checked={Boolean(f[k])} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4" /></span></label>
  );
  const mySpecs = specs.filter((s) => !f.sampleTypeId || !s.sampleTypeId || s.sampleTypeId === f.sampleTypeId);
  return (
    <div className="space-y-[15px]">
      <fieldset disabled={!canWrite} className="grid gap-x-[30px] gap-y-[15px] lg:grid-cols-2">
        <div className="space-y-[15px]">
          {text("name", "Tên")}
          {text("englishName", "Tên tiếng Anh")}
          {text("printName", "Tên khi in")}
          {text("abbreviation", "Viết tắt")}
          {text("unit", "Đơn vị")}
          {text("note", "Ghi chú")}
          <label className={row}><span className={label}>Loại mẫu</span>{sel("sampleTypeId", types)}</label>
          <label className={row}><span className={label}>Công thức</span>{sel("formulaCode", formulas)}</label>
          {check("isField", "Chỉ tiêu hiện trường")}
          <label className={row}><span className={label}>Nhóm chỉ tiêu</span>{sel("groupName", groups.map((g) => ({ value: g, label: g })))}</label>
          <label className={row}><span className={label}>Quy chuẩn 1</span>{sel("spec1Id", mySpecs, "-Chọn quy chuẩn-")}</label>
          <label className={row}><span className={label}>Quy chuẩn 2</span>{sel("spec2Id", mySpecs, "-Chọn quy chuẩn-")}</label>
          <label className={row}><span className={label}>Thứ tự</span><input inputMode="numeric" value={f.sort || ""} onChange={(e) => set("sort", Number(e.target.value) || 0)} className={input} /></label>
          <label className={row}><span className={label}>Phương pháp lấy mẫu</span>{sel("samplingMethod", methods.map((m) => ({ value: m, label: m })))}</label>
          {!id && <label className={row}><span className={label}>Phương pháp phân tích</span>{sel("method", methods.map((m) => ({ value: m, label: m })))}</label>}
          {check("noKFactor", "Không nhân hệ số K trong mẫu khí thải")}
          {check("notInQuote", "Không đưa vào báo giá đơn hàng")}
          {check("allocatedCost", "Chi phí phân bổ")}
        </div>
        <div className="space-y-[15px]">
          <label className={rowR}><span className={label}>Ngành công nghiệp</span>{sel("industry", industries.map((i) => ({ value: i, label: i })))}</label>
          {DECIMAL_BANDS.map((b) => (
            <label key={b.key} className={rowR}>
              <span className={label}>Phần thập phân với kết quả {b.label.replace("≥", ">=")}</span>
              <input inputMode="numeric" value={f.decimals[b.key] ?? ""} onChange={(e) => setDec(b.key, e.target.value)} className={input} />
            </label>
          ))}
          <hr className="border-[#eee]" />
          <label className={rowR}><span className={label}>Phạm vi thực hiện</span>{sel("scope", scopes.map((s) => ({ value: s, label: s })))}</label>
          <label className={rowR}><span className={label}>Giới hạn định lượng (LOQ)</span><input value={f.loq} onChange={(e) => set("loq", e.target.value)} className={input} /></label>
          <label className={rowR}><span className={label}>Đơn giá tham khảo (đ)</span><input inputMode="numeric" value={f.unitPrice || ""} onChange={(e) => set("unitPrice", Number(e.target.value) || 0)} className={input} /></label>
          <label className={rowR}><span className={label}>Số TT phép thử VILAS</span><input inputMode="numeric" value={f.accreditedNo ?? ""} onChange={(e) => set("accreditedNo", e.target.value === "" ? null : Number(e.target.value))} className={input} /></label>
          {check("active", "Đang dùng", rowR)}
        </div>
      </fieldset>
      <hr className="border-[#eee]" />
      <XSaveBar backHref="/lab-analytes" canWrite={canWrite} busy={busy} save={(exit) => void save(exit)} />
    </div>
  );
}
