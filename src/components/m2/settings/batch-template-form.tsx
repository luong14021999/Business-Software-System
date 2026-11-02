"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { XInput, XRow, type XFormField } from "@/components/m2/lab-ui/x-form";
import { XSaveBar, useXSave } from "@/components/m2/lab-ui/x-save";
import { btn, input, table } from "@/components/m2/lab-ui/page";

type Opt = { value: string; label: string };
/** Thiết bị / hóa chất của template lưu dạng "A; B; C" (cùng cách mẻ thử nghiệm đọc khi tạo mẻ từ template). */
const split = (s: string) => s.split(/\s*;\s*|\n/).map((x) => x.trim()).filter(Boolean);

/** Template mẻ thử nghiệm như XaLab: tab Thông tin (tên, người phân tích), Thiết bị phân tích, Hoá chất. */
export function BatchTemplateForm({ id, initial, staff, methods, instruments, chemicals, canWrite }: { id?: string; initial: { name: string; analyst: string; method: string; note: string; active: boolean; instrumentCode: string; chemicals: string }; staff: Opt[]; methods: Opt[]; instruments: string[]; chemicals: string[]; canWrite: boolean }) {
  const [tab, setTab] = useState<"info" | "tb" | "hc">("info");
  const [v, setV] = useState({ ...initial, tb: split(initial.instrumentCode), hc: split(initial.chemicals) });
  const [pick, setPick] = useState("");
  const fields: XFormField[] = [
    { name: "name", label: "Tên", required: true },
    { name: "analyst", label: "Người phân tích", type: "select", options: staff, empty: "-chọn nhân sự-" },
    { name: "method", label: "Phương pháp", type: "select", options: methods, empty: "" },
    { name: "note", label: "Ghi chú", type: "textarea" },
    { name: "active", label: "Đang dùng", type: "checkbox" },
  ];
  const { busy, save } = useXSave({
    endpoint: "/api/batch-templates",
    id,
    backHref: "/batch-templates",
    editBase: "/batch-templates",
    payload: () => (!v.name.trim() ? "Nhập tên" : { name: v.name, analyst: v.analyst, method: v.method, note: v.note, active: v.active, instrumentCode: v.tb.join("; "), chemicals: v.hc.join("; ") }),
  });
  const key = tab === "tb" ? "tb" : "hc";
  const pool = (tab === "tb" ? instruments : chemicals).filter((x) => !v[key].includes(x));
  const tabCls = (on: boolean) => `-mb-px block rounded-t border px-[15px] py-[10px] text-sm ${on ? "border-[#ddd] border-b-transparent bg-[linear-gradient(#f5fafd,#e8f3fa)] text-[#333]" : "border-transparent text-[#337ab7] hover:bg-[#eee]"}`;
  return (
    <div className="space-y-[15px]">
      <div className="flex border-b border-[#ddd]">
        <button type="button" className={tabCls(tab === "info")} onClick={() => setTab("info")}>Thông tin</button>
        <button type="button" className={tabCls(tab === "tb")} onClick={() => { setTab("tb"); setPick(""); }}>Thiết bị phân tích ({v.tb.length})</button>
        <button type="button" className={tabCls(tab === "hc")} onClick={() => { setTab("hc"); setPick(""); }}>Hoá chất ({v.hc.length})</button>
      </div>
      <fieldset disabled={!canWrite} className="space-y-[15px]">
        {tab === "info" ? (
          fields.map((f) => (
            <XRow key={f.name} label={f.label} top={f.type === "textarea"}>
              <XInput f={f} value={v[f.name as keyof typeof v]} onChange={(x) => setV((s) => ({ ...s, [f.name]: x }))} />
            </XRow>
          ))
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1">
              <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={tab === "tb" ? "Thiết bị phân tích" : "Hoá chất"} className={`${input} !w-96`}>
                <option value="" />
                {pool.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <button type="button" className={btn} disabled={!pick} onClick={() => { setV((s) => ({ ...s, [key]: [...s[key], pick] })); setPick(""); }}>Thêm</button>
            </div>
            <table className={table}>
              <thead><tr><th>#</th><th>{tab === "tb" ? "Thiết bị phân tích" : "Hoá chất"}</th><th /></tr></thead>
              <tbody>
                {v[key].length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">Chưa chọn</td></tr>}
                {v[key].map((x, i) => (
                  <tr key={x}><td>{i + 1}</td><td>{x}</td><td className="text-right"><button type="button" onClick={() => setV((s) => ({ ...s, [key]: s[key].filter((y) => y !== x) }))} aria-label={`Bỏ ${x}`} className="text-[#a94442]"><X className="h-4 w-4" /></button></td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </fieldset>
      <hr className="border-[#eee]" />
      <XSaveBar backHref="/batch-templates" canWrite={canWrite} busy={busy} save={save} />
    </div>
  );
}
