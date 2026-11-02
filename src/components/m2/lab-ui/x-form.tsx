"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { btn, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import type { Opt, XFieldType } from "@/lib/modules/m2/catalog-registry";

export type XFormField = { name: string; label: string; type?: XFieldType; options?: Opt[]; empty?: string; required?: boolean; placeholder?: string; nullable?: boolean };

/** Một dòng form ngang kiểu XaLab: nhãn đậm căn phải 165px, ô nhập 360px. */
export function XRow({ label, children, top = false }: { label: string; children: React.ReactNode; top?: boolean }) {
  return (
    <div className={`grid gap-1 sm:grid-cols-[165px_360px] sm:gap-x-[30px] ${top ? "sm:items-start" : "sm:items-center"}`}>
      <span className="text-sm font-bold text-[#333] sm:text-right">{label}</span>
      <div>{children}</div>
    </div>
  );
}

/** Ô nhập theo kiểu trường (văn bản, số, ngày, chọn, ô tích lớn, nhiều dòng). */
export function XInput({ f, value, onChange, disabled }: { f: XFormField; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  const id = `f-${f.name}`;
  if (f.type === "checkbox") {
    return <input id={id} type="checkbox" disabled={disabled} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} aria-label={f.label} className="h-6 w-6 rounded border-[#ccc]" />;
  }
  if (f.type === "select") {
    const opts = f.options ?? [];
    const v = String(value ?? "");
    return (
      <select id={id} disabled={disabled} value={v} onChange={(e) => onChange(e.target.value)} aria-label={f.label} className={input}>
        {f.empty !== undefined && <option value="">{f.empty}</option>}
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        {v && !opts.some((o) => o.value === v) && <option value={v}>{v}</option>}
      </select>
    );
  }
  if (f.type === "textarea") {
    return <textarea id={id} disabled={disabled} rows={3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} aria-label={f.label} className={`${input} h-auto py-1.5`} />;
  }
  const type = f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text";
  const shown = f.type === "date" ? String(value ?? "").slice(0, 10) : value === null || value === undefined ? "" : String(value);
  return <input id={id} type={type} disabled={disabled} step={f.type === "number" ? "any" : undefined} value={shown} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} aria-label={f.label} className={input} />;
}

/** Giá trị gửi lên máy chủ: số → Number (trống → null nếu cho phép, ngược lại 0), chuỗi bỏ khoảng trắng thừa. */
export function payloadOf(fields: XFormField[], values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "checkbox") out[f.name] = Boolean(v);
    else if (f.type === "number") out[f.name] = String(v ?? "").trim() === "" ? (f.nullable ? null : 0) : Number(v);
    else out[f.name] = typeof v === "string" ? v.trim() : (v ?? "");
  }
  return out;
}

/**
 * Form Thêm / Sửa toàn trang như XaLab: các dòng nhãn – ô nhập, cuối form [←] [Lưu & thoát] [Lưu].
 * Thêm mới xong "Lưu" chuyển sang trang sửa của bản ghi vừa tạo.
 */
export function XForm({
  fields,
  initial,
  endpoint,
  id,
  backHref,
  editBase,
  canWrite = true,
  extra,
}: {
  fields: XFormField[];
  initial: Record<string, unknown>;
  /** API danh sách (POST) – sửa dùng `${endpoint}/${id}` (PATCH). */
  endpoint: string;
  id?: string;
  backHref: string;
  /** Đường dẫn gốc trang sửa: tạo xong chuyển sang `${editBase}/${id}`. */
  editBase?: string;
  canWrite?: boolean;
  /** Dữ liệu gửi kèm không hiện trên form (VD khóa ngoại cha). */
  extra?: Record<string, unknown>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();

  async function save(exit: boolean) {
    const missing = fields.find((f) => f.required && !String(values[f.name] ?? "").trim());
    if (missing) return toast.error(`Nhập ${missing.label.toLowerCase()}`);
    setBusy(exit ? "exit" : "save");
    const res = await fetch(id ? `${endpoint}/${id}` : endpoint, {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...extra, ...payloadOf(fields, values) }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu");
    if (exit) return start(() => router.push(backHref));
    if (!id && b.item?.id && editBase) return start(() => router.replace(`${editBase}/${b.item.id}`));
    start(() => router.refresh());
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(false); }} className="space-y-[15px]">
      <fieldset disabled={!canWrite} className="space-y-[15px]">
        {fields.map((f) => (
          <XRow key={f.name} label={f.label} top={f.type === "textarea"}>
            <XInput f={f} value={values[f.name]} onChange={(v) => setValues((x) => ({ ...x, [f.name]: v }))} />
          </XRow>
        ))}
      </fieldset>
      <hr className="border-[#eee]" />
      <div className="flex flex-wrap gap-1">
        <Link href={backHref} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
        {canWrite && (
          <>
            <button type="button" disabled={Boolean(busy)} onClick={() => save(true)} className={btnPrimary}>{busy === "exit" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
            <button type="submit" disabled={Boolean(busy)} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
          </>
        )}
      </div>
    </form>
  );
}
