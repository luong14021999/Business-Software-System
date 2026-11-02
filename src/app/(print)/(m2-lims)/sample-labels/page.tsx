import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/m2/reports/print-button";
import { samplesStore } from "@/lib/modules/m2/data/samples";
import { code128Svg } from "@/lib/platform/barcode/code128";
import { labInfo } from "@/lib/modules/m2/accreditation";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "In nhãn mẫu" };

/** Nhãn mẫu 60 × 38 mm: mã mẫu, QR (mở hồ sơ hành trình), mã vạch Code 128 (M2.1). */
export default async function SampleLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ codes?: string; copies?: string }>;
}) {
  const { codes = "", copies = "1" } = await searchParams;
  const wanted = codes.split(",").map((c) => c.trim()).filter(Boolean);
  const all = await samplesStore.list();
  const samples = wanted.map((c) => all.find((s) => s.code === c)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const n = Math.min(10, Math.max(1, Number(copies) || 1));
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const labels = await Promise.all(
    samples.map(async (s) => {
      const qr = await QRCode.toString(`${origin}/samples/${encodeURIComponent(s.code)}`, { type: "svg", margin: 0, width: 64 });
      let barcode = "";
      try {
        barcode = code128Svg(s.code, { height: 26, module: 1 });
      } catch {
        barcode = "";
      }
      return { s, qr, barcode };
    }),
  );

  return (
    <div className="py-6 print:py-0">
      <style>{`@page { size: A4; margin: 8mm; } .lbl { width: 60mm; height: 38mm; } .lbl svg { display: block; }`}</style>
      <div className="max-w-[210mm] mx-auto mb-4 px-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/requests" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Danh sách mẫu
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{samples.length} mẫu × {n} bản</span>
          {[1, 2, 3].map((c) => (
            <Link key={c} href={`/sample-labels?codes=${encodeURIComponent(codes)}&copies=${c}`} className={`h-8 px-2.5 inline-flex items-center rounded-md border text-xs ${n === c ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
              {c} bản
            </Link>
          ))}
          <PrintButton />
        </div>
      </div>
      {wanted.length > samples.length && (
        <div className="max-w-[210mm] mx-auto mb-3 px-4 text-sm text-rose-600 print:hidden">Không tìm thấy {wanted.length - samples.length} mã mẫu</div>
      )}
      <div className="max-w-[210mm] mx-auto bg-white p-[8mm] print:p-0 flex flex-wrap gap-[3mm] text-black">
        {labels.flatMap(({ s, qr, barcode }) =>
          Array.from({ length: n }, (_, i) => (
            <div key={`${s.code}-${i}`} className="lbl border border-gray-400 rounded-[1.5mm] p-[2mm] flex flex-col justify-between overflow-hidden break-inside-avoid">
              <div className="flex gap-[2mm]">
                <div className="w-[16mm] h-[16mm] shrink-0 [&_svg]:w-full [&_svg]:h-full" dangerouslySetInnerHTML={{ __html: qr }} />
                <div className="min-w-0 leading-tight">
                  <div className="text-[6.5pt] uppercase truncate">{labInfo.accreditedName} · {labInfo.vilasCode}</div>
                  <div className="text-[9.5pt] font-bold font-mono break-all">{s.code}</div>
                  <div className="text-[7pt] truncate">{s.customer}</div>
                  <div className="text-[7pt] truncate">{s.type}</div>
                </div>
              </div>
              <div className="flex justify-between text-[6.5pt]">
                <span>Nhận: {fmtDateVN(s.receivedAt?.slice(0, 10))}</span>
                <span>Hạn: {fmtDateVN(s.dueAt?.slice(0, 10))}</span>
                <span>{s.criteria.length} chỉ tiêu</span>
              </div>
              {barcode ? (
                <div className="h-[8mm] [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: barcode }} />
              ) : (
                <div className="text-[6pt] text-gray-500">Mã có ký tự ngoài Code 128 – dùng QR</div>
              )}
            </div>
          )),
        )}
      </div>
    </div>
  );
}
