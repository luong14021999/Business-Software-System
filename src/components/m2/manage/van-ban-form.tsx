"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XInput, XRow, type XFormField } from "@/components/m2/lab-ui/x-form";
import { XSaveBar, useXSave } from "@/components/m2/lab-ui/x-save";
import { link } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

const FIELDS: XFormField[] = [
  { name: "number", label: "Số văn bản", required: true },
  { name: "issuedAt", label: "Ngày ban hành", type: "date" },
  { name: "issuer", label: "Cơ quan ban hành" },
  { name: "summary", label: "Trích yếu" },
  { name: "note", label: "Ghi chú" },
];
const MAX = 10 * 1024 * 1024;

/** Form hồ sơ (văn bản) như XaLab: số, ngày, cơ quan ban hành, trích yếu, ghi chú, file đính kèm, nhân viên được giao. */
export function VanBanForm({ id, initial, fileName, staff, canWrite }: { id?: string; initial: Record<string, unknown>; fileName: string; staff: string[]; canWrite: boolean }) {
  const [values, setValues] = useState(initial);
  const [assignees, setAssignees] = useState(new Set((initial.assignees as string[]) ?? []));
  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const router = useRouter();
  const { busy, save } = useXSave({
    endpoint: "/api/van-bans",
    id,
    backHref: "/van-bans",
    editBase: "/van-bans",
    payload: () => {
      if (!String(values.number ?? "").trim()) return "Nhập số văn bản";
      if (file && file.size > MAX) return "File đính kèm tối đa 10 MB";
      return { ...values, assignees: [...assignees] };
    },
  });
  // Lưu thông tin trước, rồi tải file (nếu có) lên bản ghi vừa lưu.
  async function saveAll(exit: boolean) {
    if (!file && !removeFile) return save(exit);
    const target = id ?? (await createFirst());
    if (!target) return;
    const fd = new FormData();
    if (file) fd.set("file", file);
    const res = await fetch(`/api/van-bans/${target}/file`, { method: file ? "POST" : "DELETE", body: file ? fd : undefined });
    if (!res.ok) return toast.error("Không lưu được file", (await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    setFile(null);
    setRemoveFile(false);
    if (id) return save(exit);
    toast.success("Đã lưu");
    router.push(exit ? "/van-bans" : `/van-bans/${target}`);
  }
  async function createFirst() {
    const res = await fetch("/api/van-bans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, assignees: [...assignees] }) });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
      return null;
    }
    return b.item?.id as string;
  }
  return (
    <div className="space-y-[15px]">
      <fieldset disabled={!canWrite} className="space-y-[15px]">
        {FIELDS.map((f) => (
          <XRow key={f.name} label={f.label}>
            <XInput f={f} value={values[f.name]} onChange={(v) => setValues((x) => ({ ...x, [f.name]: v }))} />
          </XRow>
        ))}
        <XRow label="File đính kèm">
          <div className="space-y-1 text-sm">
            {fileName && !removeFile && (
              <div className="flex items-center gap-2">
                <a href={`/api/van-bans/${id}/file`} className={link}>{fileName}</a>
                {canWrite && <button type="button" onClick={() => setRemoveFile(true)} className="text-[#a94442] hover:underline">Bỏ file</button>}
              </div>
            )}
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="File đính kèm" />
          </div>
        </XRow>
        <XRow label="Nhân viên được giao" top>
          <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded border border-[#ccc] p-2 text-sm sm:grid-cols-2">
            {staff.map((s) => (
              <label key={s} className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={assignees.has(s)} onChange={() => setAssignees((x) => { const n = new Set(x); if (n.has(s)) n.delete(s); else n.add(s); return n; })} />{s}
              </label>
            ))}
          </div>
        </XRow>
        <XRow label="Đang dùng">
          <XInput f={{ name: "active", label: "Đang dùng", type: "checkbox" }} value={values.active} onChange={(v) => setValues((x) => ({ ...x, active: v }))} />
        </XRow>
      </fieldset>
      <hr className="border-[#eee]" />
      <XSaveBar backHref="/van-bans" canWrite={canWrite} busy={busy} save={(exit) => void saveAll(exit)} />
    </div>
  );
}
