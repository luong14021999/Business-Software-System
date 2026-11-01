import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { LabPage, btn, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { BatchLines } from "@/components/m2/batches/batch-lines";
import { analyteStore, batchLines, freeLines, orderSampleStore, testBatchStore } from "@/lib/modules/m2/data/orders";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

type SP = { method?: string; from?: string; to?: string };

/** Mẻ thử nghiệm: thông tin mẻ, các mã mẫu trong mẻ, tìm thêm mã mẫu cùng phương pháp để đưa vào. */
export default async function TestBatchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const [batches, analytes, access] = await Promise.all([testBatchStore.list(), analyteStore.list(), currentAccess()]);
  const batch = batches.find((b) => b.id === id);
  if (!batch) notFound();
  const method = sp.method ?? batch.method;
  const [mine, free, samples] = await Promise.all([batchLines(id), freeLines({ method, from: sp.from, to: sp.to }), orderSampleStore.list()]);
  const sample = new Map(samples.map((s) => [s.code, s]));
  const methods = [...new Set(analytes.map((a) => a.method).filter(Boolean))].sort();
  const canWrite = access.can("results.enter");
  const info: [string, string][] = [
    ["Phương pháp", batch.method || "—"],
    ["Người phân tích", batch.analyst || "—"],
    ["Thiết bị", batch.instrumentCode || "—"],
    ["Hóa chất", batch.chemicals || "—"],
    ["Bắt đầu", fmtDateTimeVN(batch.startedAt)],
    ["Kết thúc", fmtDateTimeVN(batch.finishedAt)],
    ["Trạng thái", batch.status],
  ];
  return (
    <LabPage
      title={`Mẻ thử nghiệm ${batch.code}`}
      toolbar={
        <>
          <Link href="/test-batches" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
          <Link href={`/test-batches/${id}/results`} className={btnPrimary}>Nhập/duyệt kết quả ({mine.length} dòng)</Link>
        </>
      }
    >
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
        {info.map(([k, v]) => (
          <div key={k} className="contents"><dt className="font-bold sm:text-right">{k}</dt><dd className="whitespace-pre-line">{v}</dd></div>
        ))}
      </dl>

      <h2 className="mt-6 text-xl font-medium">Mã mẫu đã chọn</h2>
      <div className="mt-2">
        <BatchLines batchId={id} mode="remove" canWrite={canWrite} lines={mine.map((l) => ({ ...l, receivedAt: sample.get(l.sampleCode)?.receivedAt, isQc: sample.get(l.sampleCode)?.isQc, isDuplicate: sample.get(l.sampleCode)?.isDuplicate }))} />
      </div>

      {canWrite && (
        <>
          <h2 className="mt-8 text-xl font-medium">Tìm mã mẫu</h2>
          <form action={`/test-batches/${id}`} className="mt-2 flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="mb-1 block font-bold">Nhận mẫu từ</span>
              <input type="date" name="from" defaultValue={sp.from ?? ""} className={`${input} !w-40`} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-bold">đến</span>
              <input type="date" name="to" defaultValue={sp.to ?? ""} className={`${input} !w-40`} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-bold">Phương pháp</span>
              <select name="method" defaultValue={method} className={`${input} !w-72`}>
                <option value="">— Mọi phương pháp —</option>
                {methods.map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>
            <button className={btn}><Search className="h-4 w-4" />Tìm mã mẫu</button>
          </form>
          <p className="mt-1 text-xs text-muted-foreground">Chỉ hiện dòng kết quả chưa thuộc mẻ nào và chưa nộp duyệt (tối đa 500 dòng).</p>
          <div className="mt-2">
            <BatchLines batchId={id} mode="add" canWrite={canWrite} lines={free} />
          </div>
        </>
      )}
    </LabPage>
  );
}
