"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, List, Loader2, Printer, X } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { btn, btnPrimary, btnXs, input, link, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { fmtDateTimeVN, fmtDateVN, fromLocalInputVN, toLocalInputVN } from "@/lib/platform/dates";
import { cn } from "@/lib/utils";

/** "Chức năng ☰" và "In ấn 🖨" của một mẻ trong danh sách, như XaLab. */
export function BatchRowMenu({ id, code, canWrite }: { id: string; code: string; canWrite: boolean }) {
  const [, start] = useTransition();
  const router = useRouter();
  async function setStatus(status: string) {
    const res = await fetch(`/api/test-batches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!res.ok) return toast.error("Không đổi được trạng thái", (await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    toast.success(`Mẻ ${code}: ${status}`);
    start(() => router.refresh());
  }
  async function remove() {
    if (!confirm(`Xóa mẻ ${code}? Các dòng kết quả trong mẻ được giữ lại (bỏ khỏi mẻ).`)) return;
    const res = await fetch(`/api/test-batches/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Không xóa được", (await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    start(() => router.refresh());
  }
  return (
    <span className="inline-flex gap-1">
      <Dropdown
        className={btnXs}
        label="Chức năng"
        icon={<List className="h-3 w-3" aria-hidden />}
        align="right"
        items={[
          { label: "Danh sách mã mẫu", href: `/test-batches/${id}` },
          { label: "Nhập/duyệt kết quả", href: `/test-batches/${id}/results` },
          ...(canWrite
            ? [
                { label: "Nhập Excel kết quả", href: `/test-batches/${id}/import` },
                { label: "Phân tích", onClick: () => setStatus("Phân tích") },
                { label: "Trả kết quả", onClick: () => setStatus("Trả kết quả") },
                { label: "Duyệt", onClick: () => setStatus("Duyệt") },
                { label: "Xóa", danger: true, onClick: remove },
              ]
            : []),
        ]}
      />
      <Dropdown
        className={btnXs}
        label="In ấn"
        icon={<Printer className="h-3 w-3" aria-hidden />}
        align="right"
        items={[
          { label: "Biên bản thử nghiệm", href: `/batch-print/${id}?loai=bien-ban` },
          { label: "Kết quả phân tích", href: `/batch-print/${id}?loai=ket-qua` },
        ]}
      />
    </span>
  );
}

const TABS = ["Thông tin", "Thiết bị phân tích", "Hoá chất"] as const;

/** Sửa mẻ thử nghiệm như XaLab: tab Thông tin (người phân tích, ngày bắt đầu, ngày kết thúc), Thiết bị phân tích, Hoá chất. */
export function BatchEditForm({
  batch,
  staff,
  instruments,
  chemicals,
}: {
  batch: { id: string; analyst: string; startedAt: string; finishedAt: string; instrumentCode: string; chemicals: string };
  staff: string[];
  instruments: string[];
  chemicals: string[];
}) {
  const split = (s: string) => s.split(/\n|;/).map((x) => x.trim()).filter(Boolean);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Thông tin");
  const [analyst, setAnalyst] = useState(batch.analyst);
  const [finishedAt, setFinishedAt] = useState(toLocalInputVN(batch.finishedAt));
  const [inst, setInst] = useState<string[]>(split(batch.instrumentCode));
  const [chem, setChem] = useState<string[]>(split(batch.chemicals));
  const [pickInst, setPickInst] = useState("");
  const [pickChem, setPickChem] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();

  async function save(exit: boolean) {
    setBusy(exit ? "exit" : "save");
    const res = await fetch(`/api/test-batches/${batch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analyst, finishedAt: fromLocalInputVN(finishedAt), instrumentCode: inst.join("\n"), chemicals: chem.join("\n") }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được mẻ", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu mẻ thử nghiệm");
    start(() => (exit ? router.push("/test-batches") : router.refresh()));
  }

  const row = "grid items-center gap-1 sm:grid-cols-[165px_360px] sm:gap-x-[30px]";
  const lbl = "text-sm font-bold sm:text-right";
  const listTab = (items: string[], setItems: (f: (xs: string[]) => string[]) => void, options: string[], pick: string, setPick: (v: string) => void, label: string) => (
    <div className="space-y-3">
      <div className="flex gap-1">
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={label} className={`${input} max-w-md`}>
          <option value="" />
          {options.filter((o) => !items.includes(o)).map((o) => <option key={o}>{o}</option>)}
        </select>
        <button type="button" onClick={() => { if (pick) { setItems((xs) => [...xs, pick]); setPick(""); } }} className={btn}>Thêm</button>
      </div>
      <table className={table}>
        <thead><tr><th>Tên</th><th className="w-20" /></tr></thead>
        <tbody>
          {items.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">Chưa có</td></tr>}
          {items.map((x) => (
            <tr key={x}><td>{x}</td><td><button type="button" onClick={() => setItems((xs) => xs.filter((y) => y !== x))} className={`${link} inline-flex items-center gap-0.5`}>Xóa <X className="h-3.5 w-3.5 stroke-[3]" /></button></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div role="tablist" className="mb-5 flex border-b border-[#ddd]">
        {TABS.map((t) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("-mb-px rounded-t border px-[15px] py-2.5 text-sm", tab === t ? "border-[#ddd] border-b-white bg-white text-[#555]" : "border-transparent text-[#337ab7] hover:bg-[#eee]")}>{t}</button>
        ))}
      </div>
      {tab === "Thông tin" && (
        <div className="space-y-[15px]">
          <div className={row}>
            <span className={lbl}>Người phân tích</span>
            <select value={analyst} onChange={(e) => setAnalyst(e.target.value)} aria-label="Người phân tích" className={input}>
              <option value="">-chọn nhân sự-</option>
              {staff.map((s) => <option key={s}>{s}</option>)}
              {analyst && !staff.includes(analyst) && <option>{analyst}</option>}
            </select>
          </div>
          <div className={row}><span className={lbl}>Ngày bắt đầu</span><span className="text-sm">{fmtDateTimeVN(batch.startedAt) || "—"}</span></div>
          <div className={row}><span className={lbl}>Ngày kết thúc</span><input type="datetime-local" value={finishedAt} onChange={(e) => setFinishedAt(e.target.value)} aria-label="Ngày kết thúc" className={`${input} bg-[#eee]`} /></div>
        </div>
      )}
      {tab === "Thiết bị phân tích" && listTab(inst, setInst, instruments, pickInst, setPickInst, "Thiết bị phân tích")}
      {tab === "Hoá chất" && listTab(chem, setChem, chemicals, pickChem, setPickChem, "Hoá chất")}
      <hr className="my-5 border-[#eee]" />
      <div className="flex gap-1">
        <Link href="/test-batches" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
        <button type="button" disabled={Boolean(busy)} onClick={() => save(true)} className={btnPrimary}>{busy === "exit" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
        <button type="button" disabled={Boolean(busy)} onClick={() => save(false)} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
      </div>
    </div>
  );
}

type PickLine = { id: string; sampleCode: string; criterion: string; receivedAt?: string; isQc?: boolean; isDuplicate?: boolean };

/** "Mã mẫu đã chọn" như XaLab: dòng đã trong mẻ được tích sẵn, dòng tìm thêm chưa tích; Lưu = đưa vào / gỡ khỏi mẻ. */
export function BatchSamplePicker({ batchId, inBatch, found, canWrite }: { batchId: string; inBatch: PickLine[]; found: PickLine[]; canWrite: boolean }) {
  const rows = [...inBatch, ...found.filter((f) => !inBatch.some((x) => x.id === f.id))];
  const [on, setOn] = useState<Set<string>>(new Set(inBatch.map((l) => l.id)));
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const all = rows.length > 0 && rows.every((r) => on.has(r.id));
  async function save(exit: boolean) {
    const add = rows.filter((r) => on.has(r.id) && !inBatch.some((x) => x.id === r.id)).map((r) => r.id);
    const remove = inBatch.filter((r) => !on.has(r.id)).map((r) => r.id);
    setBusy(exit ? "exit" : "save");
    const res = await fetch(`/api/test-batches/${batchId}/lines`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ add, remove }) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Thêm ${b.added}, gỡ ${b.removed} dòng`, b.skipped ? `${b.skipped} dòng đã nộp duyệt hoặc thuộc mẻ khác – không đổi` : undefined);
    start(() => (exit ? router.push("/test-batches") : router.refresh()));
  }
  return (
    <div>
      <h2 className="mb-2 text-[18px] font-medium">Mã mẫu đã chọn</h2>
      <table className={table}>
        <thead>
          <tr>
            <th className="w-8"><input type="checkbox" aria-label="Chọn tất cả" disabled={!canWrite} checked={all} onChange={() => setOn(all ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
            <th className="w-12">#</th><th>Mã mẫu</th><th>Ngày nhận mẫu</th><th>QA/QC</th><th>Mẫu lặp</th><th>Tên chỉ tiêu</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Chưa có mã mẫu – tìm theo ngày nhận mẫu và phương pháp</td></tr>}
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td><input type="checkbox" aria-label={`Chọn ${r.sampleCode} – ${r.criterion}`} disabled={!canWrite} checked={on.has(r.id)} onChange={() => setOn((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} /></td>
              <td>{i + 1}</td>
              <td>{r.sampleCode}</td>
              <td>{fmtDateVN(r.receivedAt)}</td>
              <td><input type="checkbox" disabled checked={Boolean(r.isQc)} aria-label="QA/QC" /></td>
              <td><input type="checkbox" disabled checked={Boolean(r.isDuplicate)} aria-label="Mẫu lặp" /></td>
              <td>{r.criterion}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-5 border-[#eee]" />
      <div className="flex gap-1">
        <Link href="/test-batches" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
        {canWrite && (
          <>
            <button type="button" disabled={Boolean(busy)} onClick={() => save(true)} className={btnPrimary}>{busy === "exit" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
            <button type="button" disabled={Boolean(busy)} onClick={() => save(false)} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
          </>
        )}
      </div>
    </div>
  );
}
