"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { XInput, XRow, type XFormField } from "@/components/m2/lab-ui/x-form";
import { XSaveBar, useXSave } from "@/components/m2/lab-ui/x-save";
import { btn, input, table } from "@/components/m2/lab-ui/page";
import type { TemplateLine } from "@/lib/modules/m2/data/settings";

type Opt = { value: string; label: string };
type Analyte = { name: string; sampleTypeId: string; groupName: string; unit: string; method: string };

/** Template bóc tách như XaLab: tab Thông tin (tên, loại mẫu, mô tả) và tab Danh sách chỉ tiêu (chọn nhóm → chỉ tiêu, Thêm / Thêm tất cả). */
export function BulkTemplateForm({ id, initial, types, groups, analytes, canWrite }: { id?: string; initial: { name: string; sampleTypeId: string; description: string; active: boolean; lines: TemplateLine[] }; types: Opt[]; groups: string[]; analytes: Analyte[]; canWrite: boolean }) {
  const [tab, setTab] = useState<"info" | "lines">("info");
  const [v, setV] = useState(initial);
  const [group, setGroup] = useState("");
  const [pick, setPick] = useState("");
  const fields: XFormField[] = [
    { name: "name", label: "Tên", required: true },
    { name: "sampleTypeId", label: "Loại mẫu", type: "select", options: types, empty: "" },
    { name: "description", label: "Mô tả", type: "textarea" },
    { name: "active", label: "Đang dùng", type: "checkbox" },
  ];
  const { busy, save } = useXSave({
    endpoint: "/api/bulk-templates",
    id,
    backHref: "/bulk-templates",
    editBase: "/bulk-templates",
    payload: () => (!v.name.trim() ? "Nhập tên" : !v.sampleTypeId ? "Chọn loại mẫu" : { ...v }),
  });
  const pool = analytes.filter((a) => a.sampleTypeId === v.sampleTypeId && (!group || a.groupName === group));
  const has = new Set(v.lines.map((l) => l.name.toLowerCase()));
  const add = (list: Analyte[]) => setV((x) => ({ ...x, lines: [...x.lines, ...list.filter((a) => !has.has(a.name.toLowerCase())).map((a) => ({ name: a.name, unit: a.unit, method: a.method }))] }));
  const tabCls = (on: boolean) => `-mb-px block rounded-t border px-[15px] py-[10px] text-sm ${on ? "border-[#ddd] border-b-transparent bg-[linear-gradient(#f5fafd,#e8f3fa)] text-[#333]" : "border-transparent text-[#337ab7] hover:bg-[#eee]"}`;
  return (
    <div className="space-y-[15px]">
      <div className="flex border-b border-[#ddd]">
        <button type="button" className={tabCls(tab === "info")} onClick={() => setTab("info")}>Thông tin</button>
        <button type="button" className={tabCls(tab === "lines")} onClick={() => setTab("lines")}>Danh sách chỉ tiêu ({v.lines.length})</button>
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
            {!v.sampleTypeId && <p className="text-sm text-[#a94442]">Chọn loại mẫu ở tab Thông tin trước.</p>}
            <div className="flex flex-wrap items-center gap-1">
              <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Nhóm chỉ tiêu" className={`${input} !w-56`}>
                <option value="">-Tất cả nhóm chỉ tiêu-</option>
                {groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Chỉ tiêu" className={`${input} !w-80`}>
                <option value="" />
                {pool.filter((a) => !has.has(a.name.toLowerCase())).map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
              </select>
              <button type="button" className={btn} onClick={() => { add(pool.filter((a) => a.name === pick)); setPick(""); }} disabled={!pick}>Thêm</button>
              <button type="button" className={btn} onClick={() => add(pool)} disabled={!pool.length}>Thêm tất cả</button>
            </div>
            <table className={table}>
              <thead><tr><th>#</th><th>Chỉ tiêu</th><th>Đơn vị</th><th>Phương pháp</th><th /></tr></thead>
              <tbody>
                {v.lines.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Chưa có chỉ tiêu</td></tr>}
                {v.lines.map((l, i) => (
                  <tr key={l.name}>
                    <td>{i + 1}</td><td>{l.name}</td><td>{l.unit}</td><td>{l.method}</td>
                    <td className="text-right"><button type="button" onClick={() => setV((x) => ({ ...x, lines: x.lines.filter((_, k) => k !== i) }))} aria-label={`Bỏ ${l.name}`} className="text-[#a94442]"><X className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </fieldset>
      <hr className="border-[#eee]" />
      <XSaveBar backHref="/bulk-templates" canWrite={canWrite} busy={busy} save={save} />
    </div>
  );
}
