import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/m2/reports/print-button";
import { labInfo } from "@/lib/modules/m2/accreditation";
import { batchLines, orderSampleStore, testBatchStore } from "@/lib/modules/m2/data/orders";
import { lineText } from "@/lib/modules/m2/data/grid";
import { fmtDateTimeVN, fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const KINDS = { "bien-ban": "BIÊN BẢN THỬ NGHIỆM", "ket-qua": "KẾT QUẢ PHÂN TÍCH" } as const;
type Kind = keyof typeof KINDS;

/** Bản in theo mẻ thử nghiệm (A4): biên bản thử nghiệm (ghi kết quả tay) hoặc kết quả phân tích của các mẫu trong mẻ. */
export default async function BatchPrintPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ loai?: string }> }) {
  const [{ id }, { loai = "bien-ban" }] = await Promise.all([params, searchParams]);
  const kind: Kind = loai in KINDS ? (loai as Kind) : "bien-ban";
  const [batches, lines, samples] = await Promise.all([testBatchStore.list(), batchLines(id), orderSampleStore.list()]);
  const batch = batches.find((b) => b.id === id);
  if (!batch) notFound();
  const sample = new Map(samples.map((s) => [s.code, s]));
  const cell = "border border-black px-1.5 py-1 align-top";
  return (
    <div className="py-6 print:py-0">
      <style>{`@page { size: A4; margin: 15mm 12mm; }`}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-2 px-4 print:hidden">
        <Link href="/test-batches" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Mẻ {batch.code}</Link>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {(Object.keys(KINDS) as Kind[]).map((k) => (
            <Link key={k} href={`/batch-print/${id}?loai=${k}`} className={`inline-flex h-8 items-center rounded-md border px-2.5 text-xs ${k === kind ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{KINDS[k].toLowerCase().replace(/^./, (c) => c.toUpperCase())}</Link>
          ))}
          <PrintButton />
        </div>
      </div>
      <div className="mx-auto max-w-[210mm] bg-white p-[15mm] font-serif text-[11pt] leading-snug text-black shadow print:p-0 print:shadow-none">
        <div className="grid grid-cols-2 gap-4 text-center text-[10pt]">
          <div><div className="uppercase">{labInfo.organization}</div><div className="font-bold uppercase">{labInfo.accreditedName}</div><div className="mx-auto mt-0.5 w-24 border-t border-black" /></div>
          <div><div className="font-bold uppercase">Cộng hòa xã hội chủ nghĩa Việt Nam</div><div className="font-bold">Độc lập – Tự do – Hạnh phúc</div><div className="mx-auto mt-0.5 w-40 border-t border-black" /></div>
        </div>
        <h1 className="mt-6 text-center text-[15pt] font-bold">{KINDS[kind]}</h1>
        <div className="mt-4 space-y-0.5">
          <p><b>Mẻ thử nghiệm:</b> {batch.code} · <b>Phương pháp:</b> {batch.method || "—"}</p>
          <p><b>Người phân tích:</b> {batch.analyst || "—"} · <b>Bắt đầu:</b> {fmtDateTimeVN(batch.startedAt) || "—"} · <b>Kết thúc:</b> {fmtDateTimeVN(batch.finishedAt) || "—"}</p>
          {batch.instrumentCode && <p><b>Thiết bị:</b> {batch.instrumentCode.split("\n").join("; ")}</p>}
          {batch.chemicals && <p><b>Hóa chất:</b> {batch.chemicals.split("\n").join("; ")}</p>}
        </div>
        <table className="mt-4 w-full border-collapse text-[10.5pt]">
          <thead>
            <tr>
              <th className={cell}>TT</th><th className={cell}>Mã mẫu</th><th className={cell}>Mã mẫu phụ</th><th className={cell}>Ngày nhận</th><th className={cell}>Chỉ tiêu</th><th className={cell}>Đơn vị</th>
              {kind === "bien-ban" ? <><th className={cell}>Số đọc / ghi chép</th><th className={cell}>Kết quả</th></> : <><th className={cell}>Kết quả</th><th className={cell}>Trạng thái</th></>}
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.id}>
                <td className={`${cell} text-center`}>{i + 1}</td>
                <td className={`${cell} whitespace-nowrap font-mono`}>{l.sampleCode}</td>
                <td className={cell}>{l.subCode}</td>
                <td className={cell}>{fmtDateVN(sample.get(l.sampleCode)?.receivedAt)}</td>
                <td className={cell}>{l.criterion}</td>
                <td className={cell}>{l.unit}</td>
                {kind === "bien-ban" ? <><td className={`${cell} w-40`} /><td className={`${cell} w-24`} /></> : <><td className={`${cell} text-right`}>{lineText(l) || "—"}</td><td className={cell}>{l.status}</td></>}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 grid grid-cols-2 gap-4 text-center text-[10.5pt]">
          <div><b>Người phân tích</b><div className="italic">(ký, ghi rõ họ tên)</div><div className="mt-14">{batch.analyst}</div></div>
          <div><div className="italic">Thanh Hóa, ngày {fmtDateVN(todayISO())}</div><b>Người kiểm tra</b><div className="italic">(ký, ghi rõ họ tên)</div></div>
        </div>
      </div>
    </div>
  );
}
