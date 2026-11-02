"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { btn, btnPrimary, input, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { reauthenticate } from "@/components/platform/sign/sign-dialog";
import { averageReplicates, cellText, judge, outOfMethodRange, parseResultCell } from "@/lib/modules/m2/orders";
import { cn } from "@/lib/utils";

export type GridLine = {
  id: string;
  criterion: string;
  unit: string;
  text: string;
  method: string;
  subcontractor: string;
  status: string;
  technician: string;
  min: number | null;
  max: number | null;
  /** Giới hạn quy chuẩn in trên phiếu (số, "-", KPH, Không mùi…). */
  limitLabel: string;
  /** Quy chuẩn yêu cầu "không phát hiện": chỉ KPH hoặc "<giới hạn" là đạt. */
  ndRequired: boolean;
  /** Giới hạn phát hiện của phương pháp (cảnh báo ⚠ ngoài khoảng). */
  mMin: number | null;
  mMax: number | null;
  /** Tên in trên phiếu và kết quả đã làm tròn theo quy tắc của chỉ tiêu. */
  printName: string;
  printText: string;
  /** Cột quy chuẩn thứ 2 (nếu đơn chọn 2 cột). */
  lim2: { label: string; min: number | null; max: number | null; ndRequired: boolean } | null;
  /** Người được phân công phân tích. */
  analyst: string;
  /** Số lần đo: > 1 thì nhập từng lần, kết quả là trung bình. */
  samplingTimes: number;
  reps: string[];
  lineKind: string;
};
export type GridSample = { code: string; href: string; sampler: string; locationName: string; type: string; specName: string; specName2: string; stage: string; lines: GridLine[] };

type Action = "submit" | "qa_approve" | "qa_reject" | "manager_approve" | "manager_reject";
const EDITABLE = ["Đang nhập", "Trả lại sửa"];
const FROM: Record<Action, string[]> = {
  submit: EDITABLE,
  qa_approve: ["Chờ QA/QC"],
  qa_reject: ["Chờ QA/QC"],
  manager_approve: ["Chờ Trưởng phòng"],
  manager_reject: ["Chờ Trưởng phòng"],
};
const LABEL: Record<Action, string> = {
  submit: "Nộp QA/QC",
  qa_approve: "QA/QC duyệt",
  qa_reject: "QA/QC không duyệt",
  manager_approve: "Phê duyệt (ký điện tử)",
  manager_reject: "Trưởng phòng không duyệt",
};
const STATUS_TONE: Record<string, string> = {
  "Đang nhập": "bg-white text-[#333] border-[#ccc]",
  "Trả lại sửa": "bg-[#f2dede] text-[#a94442] border-[#ebccd1]",
  "Chờ QA/QC": "bg-[#fcf8e3] text-[#8a6d3b] border-[#faebcc]",
  "Chờ Trưởng phòng": "bg-[#d9edf7] text-[#31708f] border-[#bce8f1]",
  "Đã duyệt": "bg-[#337ab7] text-white border-[#2e6da4]",
};

/**
 * Nhập / duyệt kết quả cả đơn hàng: nhóm theo mẫu, mỗi dòng một chỉ tiêu.
 * KTV gõ kết quả (số, "<0,05", "KPH") rồi nộp; QA/QC và Trưởng phòng duyệt hàng loạt các dòng được chọn.
 */
export function ResultsGrid({
  saveUrl,
  backHref,
  samples,
  can,
  me,
  methods,
  scopes,
}: {
  /** API lưu lưới (theo đơn hàng hoặc theo mẻ). */
  saveUrl: string;
  /** Trang quay lại sau "Lưu & thoát". */
  backHref: string;
  samples: GridSample[];
  can: { enter: boolean; qa: boolean; approve: boolean };
  me: { name: string; email: string };
  methods: string[];
  /** Lựa chọn cột "Thầu phụ" (VILAS, Nội bộ, các đơn vị thầu phụ). */
  scopes: string[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const initial = useMemo(() => new Map(samples.flatMap((s) => s.lines.map((l) => [l.id, l]))), [samples]);
  const [edits, setEdits] = useState<Record<string, Partial<GridLine>>>({});
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(false);

  const val = (l: GridLine) => ({ ...l, ...edits[l.id] });
  const dirty = Object.keys(edits).filter((id) => {
    const a = initial.get(id)!;
    const b = edits[id];
    return (b.text !== undefined && b.text !== a.text) || (b.reps !== undefined && b.reps.join("|") !== a.reps.join("|")) || (b.method !== undefined && b.method !== a.method) || (b.subcontractor !== undefined && b.subcontractor !== a.subcontractor);
  });
  const set = (id: string, k: keyof GridLine, v: string) => setEdits((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));
  /** Sửa lần đo thứ i; ô kết quả hiển thị là trung bình các lần. */
  const setRep = (l: GridLine, i: number, v: string) =>
    setEdits((e) => {
      const reps = Array.from({ length: Math.max(l.samplingTimes, l.reps.length) }, (_, n) => (n === i ? v : ((e[l.id]?.reps ?? l.reps)[n] ?? "")));
      return { ...e, [l.id]: { ...e[l.id], reps, text: cellText(averageReplicates(reps)) } };
    });
  const toggle = (ids: string[], on: boolean) =>
    setSel((s) => {
      const n = new Set(s);
      for (const id of ids) {
        if (on) n.add(id);
        else n.delete(id);
      }
      return n;
    });
  const allLines = samples.flatMap((s) => s.lines);

  async function save(exit = false) {
    if (!dirty.length) {
      if (exit) router.push(backHref);
      return true;
    }
    setBusy("save");
    const res = await fetch(saveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: dirty.map((id) => {
          const { text, reps, method, subcontractor } = edits[id];
          return reps !== undefined ? { id, reps, method, subcontractor } : { id, text, method, subcontractor };
        }),
      }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      toast.error(`Lưu được ${b.saved ?? 0} dòng, có lỗi`, (b.errors ?? [b.error ?? `HTTP ${res.status}`]).join("; "));
      return false;
    }
    toast.success(`Đã lưu ${b.saved} kết quả`);
    setEdits({});
    if (exit) router.push(backHref);
    else start(() => router.refresh());
    return true;
  }

  async function act(action: Action) {
    const eligible = allLines.filter((l) => FROM[action].includes(l.status));
    const chosen = sel.size ? eligible.filter((l) => sel.has(l.id)) : [];
    const targets = action === "submit" ? chosen.filter((l) => val(l).text.trim()) : chosen;
    if (!targets.length) {
      return toast.error("Chưa chọn dòng phù hợp", `Đánh dấu các dòng ở trạng thái "${FROM[action].join(" / ")}"${action === "submit" ? " đã có kết quả" : ""}`);
    }
    if (action.endsWith("_reject") && !note.trim()) return toast.error("Ghi lý do không duyệt vào ô ghi chú");
    if (action === "submit" && dirty.length && !(await save())) return;
    if (action === "manager_approve") {
      if (!password) return toast.error("Nhập mật khẩu để ký điện tử");
      setBusy(action);
      try {
        await reauthenticate(me.email, password);
      } catch (e) {
        setBusy(null);
        return toast.error("Xác thực thất bại", (e as Error).message);
      }
    }
    setBusy(action);
    const errors: string[] = [];
    let ok = 0;
    for (const l of targets) {
      const res = await fetch(`/api/analysis-results/${l.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: note }),
      });
      if (res.ok) ok++;
      else errors.push(`${l.criterion}: ${(await res.json().catch(() => ({}))).error ?? res.status}`);
    }
    setBusy(null);
    setPassword("");
    if (ok) toast.success(`${LABEL[action]}: ${ok} dòng`);
    if (errors.length) toast.error(`${errors.length} dòng không thực hiện được`, errors.slice(0, 3).join(" · ") + (errors.length > 3 ? " …" : ""));
    setSel(new Set());
    if (ok) setNote("");
    start(() => router.refresh());
  }

  const loading = Boolean(busy);
  const actBtn = (a: Action, show: boolean, cls = btn) =>
    show && (
      <button type="button" disabled={loading} onClick={() => act(a)} className={cls}>
        {busy === a && <Loader2 className="h-4 w-4 animate-spin" />}
        {LABEL[a]}
      </button>
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={backHref} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
        {can.enter && (
          <>
            <button type="button" disabled={loading} onClick={() => save(true)} className={btnPrimary}>Lưu &amp; thoát</button>
            <button type="button" disabled={loading} onClick={() => save()} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu{dirty.length ? ` (${dirty.length})` : ""}</button>
          </>
        )}
        <button type="button" className={btn} onClick={() => setSel(new Set(allLines.map((l) => l.id)))}>Chọn tất cả</button>
        <button type="button" className={btn} onClick={() => setSel(new Set())}>Bỏ chọn</button>
        <label className="ml-1 flex items-center gap-1.5 text-sm"><input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />Chỉ chỉ tiêu phân công cho tôi</label>
        {actBtn("submit", can.enter)}
        {actBtn("qa_approve", can.qa)}
        {actBtn("qa_reject", can.qa)}
        {actBtn("manager_reject", can.approve)}
      </div>
      {(can.qa || can.approve) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú duyệt / lý do không duyệt" className={`${input} max-w-md`} />
          {can.approve && (
            <>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu ký điện tử" autoComplete="current-password" className={`${input} max-w-[14rem]`} />
              {actBtn("manager_approve", true, btnPrimary)}
            </>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Gõ kết quả dạng số (7,25), nhỏ hơn giới hạn phát hiện (&lt;0,05) hoặc KPH. Người duyệt phải khác người nhập kết quả; phê duyệt là ký điện tử nên cần mật khẩu.
      </p>

      <datalist id="grid-methods">{methods.map((m) => <option key={m} value={m} />)}</datalist>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className="w-6" />
              <th className="w-8">#</th>
              <th>Chỉ tiêu</th>
              <th>Đơn vị</th>
              <th className="w-36">Kết quả</th>
              <th>Quy chuẩn</th>
              <th>Phương pháp</th>
              <th>Thầu phụ</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          {samples.map((s0) => {
            const s = mineOnly ? { ...s0, lines: s0.lines.filter((l) => l.analyst === me.name) } : s0;
            if (!s.lines.length) return null;
            const ids = s.lines.map((l) => l.id);
            const allOn = ids.length > 0 && ids.every((id) => sel.has(id));
            return (
              <tbody key={s.code} id={s.code}>
                <tr className="bg-[#d9edf7]">
                  <td className="!border-t-[#bce8f1]"><input type="checkbox" aria-label={`Chọn các dòng của ${s.code}`} checked={allOn} onChange={() => toggle(ids, !allOn)} /></td>
                  <td colSpan={8} className="!border-t-[#bce8f1] font-bold">
                    {s.href ? <Link href={s.href} className="hover:underline">{s.code}</Link> : s.code}: {s.locationName}
                    <span className="ml-2 text-xs font-normal text-[#31708f]">{[s.type, s.stage, s.specName && `so với ${s.specName}`, s.specName2 && `và ${s.specName2}`, s.sampler && `người lấy mẫu: ${s.sampler}`].filter(Boolean).join(" · ")}</span>
                  </td>
                </tr>
                {s.lines.map((l0, i) => {
                  const l = val(l0);
                  const editable = can.enter && EDITABLE.includes(l.status);
                  const p = parseResultCell(l.text);
                  const v1 = judge(p, l);
                  const v2 = l.lim2 ? judge(p, l.lim2) : "";
                  const verdict = v1 === "Vượt" || v2 === "Vượt" ? "Vượt" : v1 || v2;
                  const outOfRange = p ? outOfMethodRange(p.value, p.prefix, l.mMin, l.mMax) : false;
                  return (
                    <tr key={l.id} className={sel.has(l.id) ? "bg-[#f5f5f5]" : undefined}>
                      <td><input type="checkbox" aria-label={`Chọn ${l.criterion}`} checked={sel.has(l.id)} onChange={() => toggle([l.id], !sel.has(l.id))} /></td>
                      <td>{i + 1}</td>
                      <td className="min-w-[14rem]">{l.criterion}{l.lineKind === "Hiện trường" && <div className="text-[11px] text-[#8a6d3b]">Hiện trường</div>}</td>
                      <td className="whitespace-nowrap">{l.unit || "-"}</td>
                      <td>
                        {editable && l.samplingTimes > 1 ? (
                          <div className="space-y-1">
                            {Array.from({ length: l.samplingTimes }, (_, n) => {
                              const r = (l.reps ?? [])[n] ?? "";
                              return (
                                <input key={n} value={r} onChange={(e) => setRep(l0, n, e.target.value)} placeholder={`Lần ${n + 1}`} aria-label={`${l.criterion} – lần đo ${n + 1}`} className={cn(`${input} h-7 px-2 text-xs`, r && !parseResultCell(r) && "border-[#a94442]")} />
                              );
                            })}
                            <div className="text-xs">TB: <span className="font-semibold">{l.text || "—"}</span></div>
                          </div>
                        ) : editable ? (
                          <input value={l.text} onChange={(e) => set(l.id, "text", e.target.value)} aria-label={`Kết quả ${l.criterion}`} className={cn(`${input} h-8`, l.text && !p && "border-[#a94442]")} />
                        ) : (
                          <>
                            <span className="font-medium">{l.text || "—"}</span>
                            {l.reps.filter(Boolean).length > 1 && <div className="text-[11px] text-muted-foreground">TB của {l.reps.filter(Boolean).join("; ")}</div>}
                          </>
                        )}
                        {(verdict === "Vượt" || outOfRange) && (
                          <div className="mt-0.5 flex gap-1 text-[11px]">
                            {verdict === "Vượt" && <span className="inline-flex items-center gap-0.5 font-semibold text-[#a94442]" title="Kết quả vượt quy chuẩn"><AlertCircle className="h-3.5 w-3.5" aria-hidden />vượt QC</span>}
                            {outOfRange && <span className="inline-flex items-center gap-0.5 text-[#8a6d3b]" title={`Ngoài giới hạn phát hiện của phương pháp (${l.mMin ?? "…"} – ${l.mMax ?? "…"})`}><AlertTriangle className="h-3.5 w-3.5" aria-hidden />ngoài GH PP</span>}
                          </div>
                        )}
                        {l.technician && <div className="text-[11px] text-muted-foreground">{l.technician}</div>}
                        {l.analyst && l.analyst !== l.technician && <div className="text-[11px] text-muted-foreground">Phân công: {l.analyst}</div>}
                      </td>
                      <td className="whitespace-nowrap text-xs">
                        {l.limitLabel || "—"}
                        {l.lim2 && <div className="text-muted-foreground">QC2: {l.lim2.label || "—"}</div>}
                        {verdict && <div className={verdict === "Vượt" ? "font-semibold text-[#a94442]" : "text-[#3c763d]"}>{verdict === "Vượt" ? "Vượt quy chuẩn" : "Đạt"}</div>}
                      </td>
                      <td>
                        {editable ? (
                          <input list="grid-methods" value={l.method} onChange={(e) => set(l.id, "method", e.target.value)} aria-label={`Phương pháp ${l.criterion}`} className={`${input} h-8 min-w-[10rem]`} />
                        ) : (
                          <span className="text-xs">{l.method || "—"}</span>
                        )}
                      </td>
                      <td>
                        {editable ? (
                          <select value={l.subcontractor} onChange={(e) => set(l.id, "subcontractor", e.target.value)} aria-label={`Thầu phụ ${l.criterion}`} className={`${input} h-8 px-2`}>
                            <option value="" />
                            {scopes.map((x) => <option key={x}>{x}</option>)}
                            {l.subcontractor && !scopes.includes(l.subcontractor) && <option>{l.subcontractor}</option>}
                          </select>
                        ) : (
                          <span className="text-xs">{l.subcontractor || "—"}</span>
                        )}
                      </td>
                      <td>
                        <span className={cn("inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs", STATUS_TONE[l.status] ?? "border-[#ccc]")}>{l.status === "Đã duyệt" ? "Duyệt" : l.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
      {samples.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Đơn hàng chưa có yêu cầu – dùng Bóc tách để tạo mẫu và chỉ tiêu.</p>}
    </div>
  );
}
