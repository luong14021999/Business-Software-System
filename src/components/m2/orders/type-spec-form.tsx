"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { btn, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";

type Opt = { id: string; name: string };
type Col = Opt & { standardId: string };

/** "Áp quy chuẩn cho tất cả yêu cầu": chép quy chuẩn theo loại mẫu xuống từng mẫu của đơn. */
export function ApplySpecsButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  async function apply() {
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/type-specs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apply: true }) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không áp được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã áp quy chuẩn cho ${b.applied} yêu cầu`);
    start(() => router.refresh());
  }
  return <button type="button" disabled={busy} onClick={apply} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Áp quy chuẩn cho tất cả yêu cầu</button>;
}

/** Bảng quy chuẩn của một loại mẫu: 10 quy chuẩn (văn bản) và 10 cột quy chuẩn thuộc các quy chuẩn đã chọn. */
export function TypeSpecForm({ orderId, sampleTypeId, standards, columns, initial }: { orderId: string; sampleTypeId: string; standards: Opt[]; columns: Col[]; initial: { standardIds: string[]; specIds: string[] } }) {
  const ten = (xs: string[]) => Array.from({ length: 10 }, (_, i) => xs[i] ?? "");
  const [std, setStd] = useState(ten(initial.standardIds));
  const [cols, setCols] = useState(ten(initial.specIds));
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const back = `/orders/${orderId}/specs`;
  const chosen = std.filter(Boolean);
  // Cột chọn được: thuộc các quy chuẩn đã chọn (chưa chọn quy chuẩn thì hiện tất cả cột của loại mẫu).
  const colOpts = columns.filter((c) => !chosen.length || chosen.includes(c.standardId));

  async function save(exit: boolean) {
    setBusy(exit ? "exit" : "save");
    const res = await fetch(`/api/orders/${orderId}/type-specs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sampleTypeId, standardIds: std, specIds: cols }) });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu bảng quy chuẩn");
    start(() => (exit ? router.push(back) : router.refresh()));
  }

  const grid = "grid gap-x-[30px] gap-y-[15px] md:grid-cols-2";
  const cell = "grid items-center gap-1 sm:grid-cols-[165px_minmax(0,1fr)] sm:gap-x-[30px]";
  const sel = (label: string, value: string, opts: Opt[], empty: string, onChange: (v: string) => void) => (
    <div key={label} className={cell}>
      <span className="text-sm font-bold sm:text-right">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={input}>
        <option value="">{empty}</option>
        {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        {value && !opts.some((o) => o.id === value) && <option value={value}>(cột không thuộc quy chuẩn đã chọn)</option>}
      </select>
    </div>
  );
  return (
    <div>
      <div className={grid}>{std.map((v, i) => sel(`Quy chuẩn ${i + 1}`, v, standards, "Chọn quy chuẩn", (x) => setStd((xs) => xs.map((y, j) => (j === i ? x : y)))))}</div>
      <hr className="my-5 border-[#eee]" />
      <div className={grid}>{cols.map((v, i) => sel(`Cột quy chuẩn ${i + 1}`, v, colOpts, "", (x) => setCols((xs) => xs.map((y, j) => (j === i ? x : y)))))}</div>
      <p className="mt-3 text-xs text-muted-foreground">Cột quy chuẩn 1 và 2 được dùng để so sánh trên lưới kết quả và in trên phiếu.</p>
      <div className="mt-5 flex gap-1">
        <Link href={back} className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
        <button type="button" disabled={Boolean(busy)} onClick={() => save(true)} className={btnPrimary}>{busy === "exit" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
        <button type="button" disabled={Boolean(busy)} onClick={() => save(false)} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
      </div>
    </div>
  );
}
