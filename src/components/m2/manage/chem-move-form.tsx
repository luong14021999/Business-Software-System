"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { XInput, XRow, type XFormField } from "@/components/m2/lab-ui/x-form";
import { XSaveBar, useXSave } from "@/components/m2/lab-ui/x-save";
import { btn, input, table } from "@/components/m2/lab-ui/page";

type Opt = { value: string; label: string };
export type ChemOpt = Opt & { unit: string };
export type LotOpt = Opt & { unit: string; left: number };
type Line = { key: number; id?: string; ref: string; qty: string; extra: string; min?: number };

/**
 * Lô nhập kho (`kind` nhap: dòng = hóa chất, lượng, hạn dùng) hoặc phiếu xuất kho (xuat: dòng = lô, lượng, mục đích).
 * Dòng đã xuất kho một phần không được giảm dưới lượng đã xuất.
 */
export function ChemMoveForm({ kind, id, initial, lines, chemicals = [], lots = [], staff, canWrite }: { kind: "nhap" | "xuat"; id?: string; initial: Record<string, unknown>; lines: Omit<Line, "key">[]; chemicals?: ChemOpt[]; lots?: LotOpt[]; staff: Opt[]; canWrite: boolean }) {
  const [values, setValues] = useState(initial);
  const [rows, setRows] = useState<Line[]>(() => (lines.length ? lines : [{ ref: "", qty: "", extra: "" }]).map((l, i) => ({ ...l, key: i })));
  const fields: XFormField[] =
    kind === "nhap"
      ? [
          { name: "name", label: "Tên lô hàng", required: true },
          { name: "date", label: "Ngày nhập kho", type: "date", required: true },
          { name: "deliverer", label: "Người giao" },
          { name: "receiver", label: "Người nhận", type: "select", options: staff, empty: "" },
          { name: "note", label: "Ghi chú", type: "textarea" },
        ]
      : [
          { name: "date", label: "Ngày xuất kho", type: "date", required: true },
          { name: "deliverer", label: "Người giao", type: "select", options: staff, empty: "" },
          { name: "receiver", label: "Người nhận", type: "select", options: staff, empty: "" },
          { name: "note", label: "Ghi chú", type: "textarea" },
        ];
  const base = kind === "nhap" ? "/chemical-manage/imports" : "/chemical-manage/exports";
  const { busy, save } = useXSave({
    endpoint: kind === "nhap" ? "/api/chemical-imports" : "/api/chemical-exports",
    id,
    backHref: base,
    editBase: base,
    payload: () => {
      const missing = fields.find((f) => f.required && !String(values[f.name] ?? "").trim());
      if (missing) return `Nhập ${missing.label.toLowerCase()}`;
      const used = rows.filter((r) => r.ref || r.qty);
      if (!used.length) return kind === "nhap" ? "Thêm ít nhất một hóa chất" : "Thêm ít nhất một dòng xuất kho";
      for (const r of used) {
        const q = Number(String(r.qty).replace(",", "."));
        if (!r.ref) return kind === "nhap" ? "Chọn hóa chất cho mọi dòng" : "Chọn lô hóa chất cho mọi dòng";
        if (!(q > 0)) return "Lượng phải lớn hơn 0";
        if (r.min && q < r.min) return `Lượng không được nhỏ hơn lượng đã xuất (${r.min})`;
      }
      const items = used.map((r) =>
        kind === "nhap"
          ? { id: r.id, chemicalId: r.ref, qty: Number(String(r.qty).replace(",", ".")), expiry: r.extra }
          : { importItemId: r.ref, qty: Number(String(r.qty).replace(",", ".")), purpose: r.extra },
      );
      return { ...values, items };
    },
  });
  const set = (key: number, patch: Partial<Line>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const unitOf = (ref: string) => (kind === "nhap" ? chemicals.find((c) => c.value === ref)?.unit : lots.find((l) => l.value === ref)?.unit) ?? "";
  return (
    <div className="space-y-[15px]">
      <fieldset disabled={!canWrite} className="space-y-[15px]">
        {fields.map((f) => (
          <XRow key={f.name} label={f.label} top={f.type === "textarea"}>
            <XInput f={f} value={values[f.name]} onChange={(v) => setValues((x) => ({ ...x, [f.name]: v }))} />
          </XRow>
        ))}
        <h3 className="pt-2 text-lg">{kind === "nhap" ? "Hóa chất trong lô" : "Hóa chất xuất kho"}</h3>
        <div className="overflow-x-auto">
          <table className={table}>
            <thead>
              <tr><th>#</th><th>{kind === "nhap" ? "Hóa chất" : "Hóa chất – lô hàng"}</th><th>Lượng</th><th>Đơn vị</th><th>{kind === "nhap" ? "Ngày hết hạn" : "Mục đích sử dụng"}</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key}>
                  <td>{i + 1}</td>
                  <td className="min-w-72">
                    <select value={r.ref} onChange={(e) => set(r.key, { ref: e.target.value })} disabled={Boolean(r.min)} aria-label="Hóa chất" className={input}>
                      <option value="" />
                      {(kind === "nhap" ? chemicals : lots).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td><input value={r.qty} inputMode="decimal" onChange={(e) => set(r.key, { qty: e.target.value })} aria-label="Lượng" className={`${input} !w-28`} />{r.min ? <div className="text-xs text-[#777]">đã xuất {r.min}</div> : null}</td>
                  <td>{unitOf(r.ref)}</td>
                  <td>
                    {kind === "nhap" ? (
                      <input type="date" value={r.extra.slice(0, 10)} onChange={(e) => set(r.key, { extra: e.target.value })} aria-label="Ngày hết hạn" className={`${input} !w-40`} />
                    ) : (
                      <input value={r.extra} onChange={(e) => set(r.key, { extra: e.target.value })} aria-label="Mục đích sử dụng" className={input} />
                    )}
                  </td>
                  <td>{!r.min && <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="text-[#a94442]" aria-label="Bỏ dòng"><X className="h-4 w-4" /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => setRows((rs) => [...rs, { key: Math.max(0, ...rs.map((x) => x.key)) + 1, ref: "", qty: "", extra: "" }])} className={btn}><Plus className="h-4 w-4" />Thêm dòng</button>
      </fieldset>
      <hr className="border-[#eee]" />
      <XSaveBar backHref={base} canWrite={canWrite} busy={busy} save={save} />
    </div>
  );
}
