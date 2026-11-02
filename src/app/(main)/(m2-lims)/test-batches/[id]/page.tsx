import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { LabPage, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { BatchSamplePicker } from "@/components/m2/batches/batch-ui";
import { analyteStore, batchLines, freeLines, orderSampleStore, testBatchStore } from "@/lib/modules/m2/data/orders";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

type SP = { method?: string; from?: string; to?: string; tim?: string };

/** Danh sách mã mẫu của mẻ như XaLab: tìm theo ngày nhận mẫu + phương pháp, tích chọn rồi Lưu. */
export default async function BatchSamplesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [batches, analytes, access] = await Promise.all([testBatchStore.list(), analyteStore.list(), currentAccess()]);
  const batch = batches.find((b) => b.id === id);
  if (!batch) notFound();
  const method = sp.method ?? batch.method;
  const [mine, found, samples] = await Promise.all([batchLines(id), sp.tim ? freeLines({ method, from: sp.from, to: sp.to }) : Promise.resolve([]), orderSampleStore.list()]);
  const sample = new Map(samples.map((s) => [s.code, s]));
  const methods = [...new Set([...analytes.map((a) => a.method), batch.method, method].filter(Boolean))].sort();
  const lbl = "text-sm font-bold sm:text-right";
  return (
    <LabPage title="Danh sách mã mẫu" subtitle={`Mẻ ${batch.code}${batch.method ? ` · ${batch.method}` : ""}`} rule={false}>
      <form action={`/test-batches/${id}`} className="grid items-center gap-x-[30px] gap-y-[15px] sm:grid-cols-[165px_165px_70px_165px]">
        <input type="hidden" name="tim" value="1" />
        <span className={lbl}>Nhận mẫu từ:</span>
        <input type="date" name="from" defaultValue={sp.from ?? ""} aria-label="Nhận mẫu từ" className={input} />
        <span className={lbl}>đến:</span>
        <input type="date" name="to" defaultValue={sp.to ?? ""} aria-label="Nhận mẫu đến" className={input} />
        <span className={lbl}>Phương pháp:</span>
        <select name="method" defaultValue={method} aria-label="Phương pháp" className={`${input} sm:col-span-2`}>
          <option value="">Chọn phương pháp</option>
          {methods.map((m) => <option key={m}>{m}</option>)}
        </select>
        <span />
        <span />
        <button className={`${btnPrimary} justify-self-start`}><Search className="h-4 w-4" />Tìm mã mẫu</button>
      </form>
      <hr className="my-5 border-[#eee]" />
      <BatchSamplePicker
        batchId={id}
        canWrite={access.can("results.enter")}
        inBatch={mine.map((l) => ({ id: l.id, sampleCode: l.sampleCode, criterion: l.criterion, receivedAt: sample.get(l.sampleCode)?.receivedAt, isQc: sample.get(l.sampleCode)?.isQc, isDuplicate: sample.get(l.sampleCode)?.isDuplicate }))}
        found={found.map((l) => ({ id: l.id, sampleCode: l.sampleCode, criterion: l.criterion, receivedAt: l.receivedAt, isQc: l.isQc, isDuplicate: l.isDuplicate }))}
      />
    </LabPage>
  );
}
