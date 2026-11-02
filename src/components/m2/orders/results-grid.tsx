"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, AlertTriangle, ArrowLeft, Loader2, Pencil } from "lucide-react";
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
  /** Phương pháp chọn được của chỉ tiêu (mặc định đứng đầu). */
  methodOptions: string[];
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
  /** Mã mẫu phụ. */
  subCode: string;
};
export type GridSample = { code: string; href: string; sampler: string; locationName: string; type: string; specName: string; specName2: string; stage: string; lines: GridLine[] };

type Action = "submit" | "qa_approve" | "qa_reject" | "manager_approve" | "manager_reject";
const EDITABLE = ["Đang nhập", "Trả lại sửa"];
const LABEL: Record<Action, string> = {
  submit: "Nộp duyệt",
  qa_approve: "Duyệt (QA/QC)",
  qa_reject: "Không duyệt (QA/QC)",
  manager_approve: "Phê duyệt (ký điện tử)",
  manager_reject: "Không duyệt (phê duyệt)",
};
const SAMPLES_PER_PAGE = 20;

/** Tách ô kết quả thành tiền tố ("<", ">", "KPH") và giá trị như hai ô của XaLab. */
const splitText = (t: string) => (/^kph$/i.test(t.trim()) ? { pfx: "KPH", val: "" } : { pfx: t.trim().match(/^[<>]/)?.[0] ?? "", val: t.trim().replace(/^[<>]\s*/, "") });
const joinText = (pfx: string, val: string) => (pfx.trim().toUpperCase() === "KPH" ? "KPH" : `${pfx.trim()}${val.trim()}`);

/**
 * Nhập / duyệt kết quả thử nghiệm như XaLab: nhóm theo mẫu; mỗi dòng có Mã mẫu phụ, Kết quả (tiền tố + kết quả),
 * Phương pháp, Thầu phụ và nút Duyệt / Không duyệt. Vẫn giữ duyệt 3 cấp ISO 17025: nút "Duyệt" thực hiện bước kế tiếp
 * mà người dùng có quyền (QA/QC hoặc phê duyệt có ký điện tử); người duyệt phải khác người nhập.
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
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);

  const val = (l: GridLine) => ({ ...l, ...edits[l.id] });
  const dirty = Object.keys(edits).filter((id) => {
    const a = initial.get(id)!;
    const b = edits[id];
    return (
      (b.text !== undefined && b.text !== a.text) ||
      (b.reps !== undefined && b.reps.join("|") !== a.reps.join("|")) ||
      (b.method !== undefined && b.method !== a.method) ||
      (b.subcontractor !== undefined && b.subcontractor !== a.subcontractor) ||
      (b.subCode !== undefined && b.subCode !== a.subCode)
    );
  });
  const set = (id: string, k: keyof GridLine, v: string) => setEdits((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));
  /** Sửa lần đo thứ i; ô kết quả hiển thị là trung bình các lần. */
  const setRep = (l: GridLine, i: number, v: string) =>
    setEdits((e) => {
      const reps = Array.from({ length: Math.max(l.samplingTimes, l.reps.length) }, (_, n) => (n === i ? v : ((e[l.id]?.reps ?? l.reps)[n] ?? "")));
      return { ...e, [l.id]: { ...e[l.id], reps, text: cellText(averageReplicates(reps)) } };
    });

  const shown = samples.map((s) => (mineOnly ? { ...s, lines: s.lines.filter((l) => l.analyst === me.name) } : s)).filter((s) => s.lines.length);
  const pages = Math.max(1, Math.ceil(shown.length / SAMPLES_PER_PAGE));
  const cur = Math.min(page, pages);
  const pageSamples = shown.slice((cur - 1) * SAMPLES_PER_PAGE, cur * SAMPLES_PER_PAGE);
  const allLines = shown.flatMap((s) => s.lines);
  const pageLines = pageSamples.flatMap((s) => s.lines);

  async function save(exit = false) {
    if (!dirty.length) {
      if (exit) router.push(backHref);
      return true;
    }
    setBusy(exit ? "exit" : "save");
    const res = await fetch(saveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: dirty.map((id) => {
          const { text, reps, method, subcontractor, subCode } = edits[id];
          return reps !== undefined ? { id, reps, method, subcontractor, subCode } : { id, text, method, subcontractor, subCode };
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

  /** Bước duyệt / không duyệt kế tiếp của một dòng theo trạng thái và quyền của người dùng. */
  const nextAction = (status: string, approve: boolean): Action | null => {
    if (status === "Chờ QA/QC" && can.qa) return approve ? "qa_approve" : "qa_reject";
    if (status === "Chờ Trưởng phòng" && can.approve) return approve ? "manager_approve" : "manager_reject";
    if (approve && can.enter && EDITABLE.includes(status)) return "submit";
    return null;
  };

  async function run(lines: GridLine[], approve: boolean) {
    const jobs = lines.map((l) => ({ l, a: nextAction(l.status, approve) })).filter((x): x is { l: GridLine; a: Action } => Boolean(x.a));
    const targets = jobs.filter((x) => x.a !== "submit" || val(x.l).text.trim());
    if (!targets.length) return toast.error("Không có dòng nào để " + (approve ? "duyệt" : "không duyệt"), "Chỉ các dòng đang chờ bước duyệt bạn có quyền (hoặc đang nhập đã có kết quả) mới thực hiện được");
    if (!approve && !note.trim()) return toast.error("Ghi lý do không duyệt vào ô ghi chú");
    if (targets.some((x) => x.a === "submit") && dirty.length && !(await save())) return;
    if (targets.some((x) => x.a === "manager_approve")) {
      if (!password) return toast.error("Nhập mật khẩu để ký điện tử");
      setBusy("act");
      try {
        await reauthenticate(me.email, password);
      } catch (e) {
        setBusy(null);
        return toast.error("Xác thực thất bại", (e as Error).message);
      }
    }
    setBusy("act");
    const errors: string[] = [];
    let ok = 0;
    for (const { l, a } of targets) {
      const res = await fetch(`/api/analysis-results/${l.id}/transition`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: a, comment: note }) });
      if (res.ok) ok++;
      else errors.push(`${l.criterion}: ${(await res.json().catch(() => ({}))).error ?? res.status}`);
    }
    setBusy(null);
    setPassword("");
    if (ok) toast.success(`${approve ? "Đã duyệt" : "Không duyệt"} ${ok} dòng`);
    if (errors.length) toast.error(`${errors.length} dòng không thực hiện được`, errors.slice(0, 3).join(" · ") + (errors.length > 3 ? " …" : ""));
    if (ok) setNote("");
    start(() => router.refresh());
  }

  const loading = Boolean(busy);
  const anyApprover = can.qa || can.approve;
  const pager =
    pages > 1 ? (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" onClick={() => setPage(p)} className={cn("-ml-px h-[34px] min-w-[34px] border px-3 first:ml-0 first:rounded-l last:rounded-r", p === cur ? "relative z-10 border-[#337ab7] bg-[#337ab7] text-white" : "border-[#ddd] text-[#337ab7] hover:bg-[#eee]")}>{p}</button>
          ))}
        </div>
        <span>Trang {cur} / {pages}</span>
      </div>
    ) : (
      <div className="text-sm">Trang 1 / 1</div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1">
        <Link href={backHref} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
        {can.enter && (
          <>
            <button type="button" disabled={loading} onClick={() => save(true)} className={btnPrimary}>{busy === "exit" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
            <button type="button" disabled={loading} onClick={() => save()} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu{dirty.length ? ` (${dirty.length})` : ""}</button>
          </>
        )}
        <button type="button" disabled={loading} onClick={() => run(pageLines, true)} className={btn}>Duyệt trang</button>
        <button type="button" disabled={loading || !anyApprover} onClick={() => run(pageLines, false)} className={btn}>Không duyệt trang</button>
        <button type="button" disabled={loading} onClick={() => run(allLines, true)} className={btn}>Duyệt tất cả</button>
        <button type="button" disabled={loading || !anyApprover} onClick={() => run(allLines, false)} className={btn}>Không duyệt tất cả</button>
        {busy === "act" && <Loader2 className="h-4 w-4 animate-spin" />}
        <label className="ml-2 flex items-center gap-1.5 text-sm"><input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />Chỉ chỉ tiêu phân công cho tôi</label>
      </div>
      {(anyApprover || can.enter) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {anyApprover && <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú / lý do không duyệt" className={`${input} max-w-md`} />}
          {can.approve && <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu ký điện tử (phê duyệt)" autoComplete="current-password" className={`${input} max-w-[16rem]`} />}
          <span className="text-xs text-muted-foreground">
            Duyệt 3 cấp: người nhập bấm Duyệt để nộp, QA/QC duyệt, Quản lý phê duyệt (ký điện tử). Người duyệt phải khác người nhập và hai bước duyệt do hai người khác nhau.
          </span>
        </div>
      )}
      {pager}

      <datalist id="grid-methods">{methods.map((m) => <option key={m} value={m} />)}</datalist>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>Chỉ tiêu</th>
              <th>Đơn vị</th>
              <th className="w-24 !whitespace-normal">Mã mẫu phụ</th>
              <th className="w-56">Kết quả</th>
              <th className="w-40">Phương pháp</th>
              <th className="w-40">Thầu phụ</th>
              <th className="w-28" />
              <th className="w-6" />
            </tr>
          </thead>
          {pageSamples.map((s) => (
            <tbody key={s.code} id={s.code}>
              <tr className="bg-[#d9edf7]">
                <td colSpan={9} className="!border-t-[#bce8f1] font-bold">
                  {s.href ? <Link href={s.href} className="hover:underline">{s.code}</Link> : s.code}: {s.locationName}
                  <span className="ml-2 text-xs font-normal text-[#31708f]">{[s.specName && `so với ${s.specName}`, s.specName2 && `và ${s.specName2}`, s.sampler && `người lấy mẫu: ${s.sampler}`].filter(Boolean).join(" · ")}</span>
                </td>
              </tr>
              {s.lines.map((l0, i) => {
                const l = val(l0);
                const editable = can.enter && EDITABLE.includes(l.status);
                const p = parseResultCell(l.text);
                const v1 = judge(p, l);
                const v2 = l.lim2 ? judge(p, l.lim2) : "";
                const verdict = v1 === "Vượt" || v2 === "Vượt" ? "Vượt" : v1;
                const outOfRange = p ? outOfMethodRange(p.value, p.prefix, l.mMin, l.mMax) : false;
                const parts = splitText(l.text);
                const approveAct = nextAction(l0.status, true);
                const rejectAct = nextAction(l0.status, false);
                const methodList = [...new Set([...l.methodOptions, ...(l.method ? [l.method] : [])])];
                return (
                  <tr key={l.id}>
                    <td>{i + 1}</td>
                    <td className="min-w-[12rem]">
                      {l.criterion}
                      {l.lineKind === "Hiện trường" && <div className="text-[11px] text-[#8a6d3b]">Hiện trường</div>}
                      {(l.technician || l.analyst) && <div className="text-[11px] text-muted-foreground">{[l.technician, l.analyst && l.analyst !== l.technician && `phân công: ${l.analyst}`].filter(Boolean).join(" · ")}</div>}
                    </td>
                    <td className="whitespace-nowrap">{l.unit || "-"}</td>
                    <td><input disabled={!editable} value={l.subCode} onChange={(e) => set(l.id, "subCode", e.target.value)} aria-label={`Mã mẫu phụ ${l.criterion}`} className={`${input} h-7 px-1.5 disabled:bg-[#eee]`} /></td>
                    <td>
                      {editable && l.samplingTimes > 1 ? (
                        <div className="space-y-1">
                          {Array.from({ length: l.samplingTimes }, (_, n) => {
                            const r = (l.reps ?? [])[n] ?? "";
                            return <input key={n} value={r} onChange={(e) => setRep(l0, n, e.target.value)} placeholder={`Lần ${n + 1}`} aria-label={`${l.criterion} – lần đo ${n + 1}`} className={cn(`${input} h-7 px-2 text-xs`, r && !parseResultCell(r) && "border-[#a94442]")} />;
                          })}
                          <div className="text-xs">TB: <span className="font-semibold">{l.text || "—"}</span></div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input disabled={!editable} value={parts.pfx} onChange={(e) => set(l.id, "text", joinText(e.target.value, parts.val))} placeholder="tiền tố" aria-label={`Tiền tố ${l.criterion}`} className={`${input} h-7 !w-16 px-1.5 disabled:bg-[#eee]`} />
                          <input disabled={!editable || parts.pfx === "KPH"} value={parts.val} onChange={(e) => set(l.id, "text", joinText(parts.pfx, e.target.value))} placeholder="kết quả" aria-label={`Kết quả ${l.criterion}`} className={cn(`${input} h-7 !w-24 px-1.5 disabled:bg-[#eee]`, l.text && !p && "border-[#a94442]")} />
                          {verdict === "Vượt" && <AlertCircle className="h-4 w-4 shrink-0 text-[#a94442]" aria-label="Vượt quy chuẩn" />}
                          {outOfRange && <AlertTriangle className="h-4 w-4 shrink-0 text-[#8a6d3b]" aria-label={`Ngoài giới hạn phương pháp (${l.mMin ?? "…"} – ${l.mMax ?? "…"})`} />}
                        </div>
                      )}
                      {(l.limitLabel || l.lim2) && <div className="mt-0.5 text-[11px] text-muted-foreground">QC: {l.limitLabel || "—"}{l.lim2 && ` · QC2: ${l.lim2.label || "—"}`}</div>}
                    </td>
                    <td>
                      {editable ? (
                        <select value={l.method} onChange={(e) => set(l.id, "method", e.target.value)} aria-label={`Phương pháp ${l.criterion}`} className={`${input} h-7 px-1.5`}>
                          <option value="" />
                          {(methodList.length ? methodList : methods).map((m) => <option key={m}>{m}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs">{l.method || "—"}</span>
                      )}
                    </td>
                    <td>
                      {editable ? (
                        <select value={l.subcontractor} onChange={(e) => set(l.id, "subcontractor", e.target.value)} aria-label={`Thầu phụ ${l.criterion}`} className={`${input} h-7 px-1.5`}>
                          <option value="" />
                          {scopes.map((x) => <option key={x}>{x}</option>)}
                          {l.subcontractor && !scopes.includes(l.subcontractor) && <option>{l.subcontractor}</option>}
                        </select>
                      ) : (
                        <span className="text-xs">{l.subcontractor || "—"}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex overflow-hidden rounded border border-[#ccc] text-xs">
                        <button type="button" disabled={loading || !approveAct} onClick={() => run([l0], true)} title={approveAct ? LABEL[approveAct] : l0.status} className={cn("flex-1 px-2 py-1.5", l0.status === "Đã duyệt" ? "bg-[#337ab7] text-white" : approveAct ? "bg-[#337ab7] text-white hover:bg-[#286090]" : "bg-[#eee] text-[#777]")}>
                          {l0.status === "Đã duyệt" ? "Đã duyệt" : l0.status === "Chờ QA/QC" ? "Chờ QA/QC" : l0.status === "Chờ Trưởng phòng" ? "Chờ phê duyệt" : "Duyệt"}
                        </button>
                        {rejectAct && <button type="button" disabled={loading} onClick={() => run([l0], false)} title={LABEL[rejectAct]} className="border-l border-[#ccc] bg-white px-1.5 text-[#a94442] hover:bg-[#f2dede]">Không</button>}
                      </div>
                      {l0.status === "Trả lại sửa" && <div className="mt-0.5 text-[11px] text-[#a94442]">Bị trả lại sửa</div>}
                    </td>
                    <td><Link href={`/result-entry?id=${l.id}`} className="text-[#337ab7]" aria-label={`Sửa chi tiết ${l.criterion}`} title="Phiếu diễn biến phân tích (chi tiết)"><Pencil className="h-4 w-4" /></Link></td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
      {samples.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Chưa có yêu cầu – dùng Bóc tách để tạo mẫu và chỉ tiêu.</p>}
    </div>
  );
}
