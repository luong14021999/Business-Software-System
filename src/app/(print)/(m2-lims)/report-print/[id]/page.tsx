import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/m2/reports/print-button";
import { getReport, recomputeHash } from "@/lib/modules/m2/data/reports";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const dateVN = (iso: string) => fmtDateVN(iso?.slice(0, 10));
/** "20/10/2026 08:46" theo giờ Việt Nam. */
function dateTimeVN(iso: string) {
  if (!iso) return "";
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}`;
}
const vn = (n: number | null) => (n === null ? "—" : String(n).replace(".", ","));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const r = await getReport((await params).id);
  return { title: r ? `${r.code} – Phiếu kết quả` : "Phiếu kết quả" };
}

export default async function ReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const report = await getReport((await params).id);
  if (!report) notFound();
  const { snapshot: s } = report;
  const rules = [...new Set(s.lines.map((l) => l.decisionRuleType).filter((t) => t && !t.startsWith("Không công bố")))];
  const approvers = [...new Set(s.lines.map((l) => l.approvedBy).filter(Boolean))];
  const hasAccredited = s.lines.some((l) => l.accredited);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const verifyUrl = `${origin}/verify/${encodeURIComponent(report.code)}?h=${report.contentHash.slice(0, 16)}`;
  const qrSvg = report.contentHash ? await QRCode.toString(verifyUrl, { type: "svg", margin: 0, width: 88 }) : "";
  const intact = report.contentHash ? recomputeHash(report) === report.contentHash : false;

  return (
    <div className="py-6 print:py-0">
      <div className="max-w-[210mm] mx-auto mb-4 px-4 flex items-center justify-between print:hidden">
        <Link href="/results" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Danh sách phiếu
        </Link>
        <PrintButton />
      </div>

      <article className="max-w-[210mm] mx-auto bg-white text-[13px] leading-relaxed text-black shadow-sm print:shadow-none px-[16mm] py-[14mm] print:p-0">
        {report.status === "Đã thay thế" && (
          <div className="mb-4 rounded border-2 border-rose-500 text-rose-700 text-center font-semibold py-1.5">
            PHIẾU ĐÃ BỊ THAY THẾ – không còn hiệu lực
          </div>
        )}
        {report.status === "Đã thu hồi" && (
          <div className="mb-4 rounded border-2 border-rose-600 text-rose-700 text-center py-1.5">
            <div className="font-bold">PHIẾU ĐÃ THU HỒI – không còn hiệu lực</div>
            <div className="text-xs">{dateTimeVN(report.revokedAt)} · {report.revokedBy} · Lý do: {report.revokeReason}</div>
          </div>
        )}
        {report.contentHash && !intact && (
          <div className="mb-4 rounded border-2 border-amber-500 text-amber-800 text-center font-semibold py-1.5 print:hidden">
            Cảnh báo: nội dung phiếu không khớp mã băm lúc ký
          </div>
        )}

        {/* b) Tên, địa chỉ PTN */}
        <header className="flex items-start gap-4 border-b-2 border-black pb-3">
          <Image src="/logo-vnnth.png" alt="" width={64} height={64} className="w-16 h-16 object-contain" />
          <div className="flex-1">
            <div className="text-xs uppercase">{s.lab.organization}</div>
            <div className="font-bold uppercase">{s.lab.name}</div>
            <div className="text-xs">{s.lab.address}</div>
            <div className="text-xs">ĐT: {s.lab.phone} · Email: {s.lab.email}</div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-sm">{s.lab.vilas}</div>
            <div>{s.lab.standard}</div>
          </div>
        </header>

        {/* a) Tiêu đề, d) nhận dạng duy nhất */}
        <div className="text-center mt-5">
          <h1 className="text-lg font-bold uppercase tracking-wide">Phiếu kết quả thử nghiệm</h1>
          <div className="mt-1">
            Số: <span className="font-mono font-semibold">{report.code}</span>
            {report.revision > 0 && <span> · Sửa đổi lần {report.revision}</span>}
          </div>
          {/* §7.8.8 phiếu sửa đổi */}
          {report.replacesCode && (
            <div className="text-xs italic mt-0.5">Phiếu này thay thế phiếu số {report.replacesCode}</div>
          )}
        </div>

        {/* e) khách hàng, g) h) mẫu, i) j) ngày */}
        <table className="w-full mt-5 text-[13px]">
          <tbody className="[&_td]:py-0.5 [&_td]:align-top">
            <tr><td className="w-52">Khách hàng:</td><td className="font-semibold">{s.customer.name}</td></tr>
            <tr><td>Địa chỉ khách hàng:</td><td>{s.customer.address || "—"}</td></tr>
            {(s.customer.contact || s.customer.phone) && (
              <tr><td>Người liên hệ:</td><td>{[s.customer.contact, s.customer.phone].filter(Boolean).join(" · ")}</td></tr>
            )}
            <tr><td>Mã mẫu (PTN):</td><td className="font-mono">{s.sample.code}</td></tr>
            <tr><td>Mô tả mẫu:</td><td>{s.sample.type || "—"}</td></tr>
            <tr><td>Ngày nhận mẫu:</td><td>{dateVN(s.sample.receivedAt) || "—"}</td></tr>
            <tr><td>Ngày thực hiện thử nghiệm:</td><td>{dateVN(s.performedFrom)}{s.performedTo && s.performedTo.slice(0, 10) !== s.performedFrom.slice(0, 10) ? ` – ${dateVN(s.performedTo)}` : ""}</td></tr>
            <tr><td>Ngày phát hành phiếu:</td><td>{dateTimeVN(report.issuedAt)}</td></tr>
          </tbody>
        </table>

        {/* f) phương pháp, m) kết quả + đơn vị, §7.8.3 ĐKĐBĐ, §7.8.6 sự phù hợp */}
        <table className="w-full mt-5 border border-black border-collapse text-[12px]">
          <thead>
            <tr className="[&_th]:border [&_th]:border-black [&_th]:px-1.5 [&_th]:py-1 bg-gray-100">
              <th className="w-8">TT</th>
              <th className="text-left">Chỉ tiêu thử nghiệm</th>
              <th className="text-left">Phương pháp thử</th>
              <th>Đơn vị</th>
              <th>Kết quả</th>
              <th>Giới hạn</th>
              <th>Đánh giá</th>
            </tr>
          </thead>
          <tbody>
            {s.lines.map((l, i) => (
              <tr key={l.resultCode} className="[&_td]:border [&_td]:border-black [&_td]:px-1.5 [&_td]:py-1 align-top">
                <td className="text-center">{i + 1}</td>
                <td>{l.criterion}{l.accredited && <sup> (*)</sup>}</td>
                <td>{l.method}</td>
                <td className="text-center whitespace-nowrap">{l.unit}</td>
                <td className="text-center whitespace-nowrap font-semibold">
                  {l.reported ? l.reported : <>{vn(l.mean)}{l.uncertainty !== null && ` ± ${vn(l.uncertainty)}`}</>}
                </td>
                <td className="text-center whitespace-nowrap">{l.decisionLimit !== null && l.conclusion !== "Báo cáo giá trị" ? vn(l.decisionLimit) : "—"}</td>
                <td className="text-center">{l.conclusion === "Báo cáo giá trị" ? "—" : l.conclusion}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* d) nhận biết kết thúc phiếu */}
        <div className="text-center text-xs mt-1 italic">— Phiếu gồm {s.lines.length} chỉ tiêu · Hết kết quả —</div>

        <div className="mt-4 space-y-1 text-[12px]">
          <div className="font-semibold">Ghi chú:</div>
          {hasAccredited && <div>(*) Phép thử được công nhận theo {s.lab.standard}, mã số {s.lab.vilas}.</div>}
          <div>Kết quả được báo cáo dạng x̄ ± U, trong đó U là độ không đảm bảo đo mở rộng, hệ số phủ k = 2 (mức tin cậy xấp xỉ 95%).</div>
          {s.lines.some((l) => l.reported) && <div>&ldquo;&lt; giá trị&rdquo;: kết quả nhỏ hơn giới hạn định lượng (LOQ) của phương pháp.</div>}
          {rules.length > 0 && (
            <div>Quy tắc quyết định áp dụng khi công bố sự phù hợp: {rules.join("; ")} (JCGM 106:2012).</div>
          )}
          {/* n) sai lệch / bổ sung / loại trừ */}
          {report.note && <div>{report.note}</div>}
          {/* l) kết quả chỉ liên quan đến mẫu thử */}
          <div>Kết quả thử nghiệm chỉ có giá trị đối với mẫu đã thử nghiệm.</div>
          <div>Không được sao chép một phần phiếu kết quả này khi chưa có sự đồng ý bằng văn bản của phòng thí nghiệm.</div>
        </div>

        {/* o) người phê duyệt */}
        <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[13px] break-inside-avoid">
          <div>
            <div className="font-semibold">Người phát hành phiếu</div>
            {report.signature ? (
              <div className="my-2 mx-auto w-fit rounded border border-emerald-600 px-3 py-1.5 text-[11px] text-emerald-800 text-left leading-snug">
                <div className="font-semibold">Đã ký điện tử</div>
                <div>{dateTimeVN(report.signature.signedAt)}</div>
                <div className="font-mono">SHA-256 {report.contentHash.slice(0, 16)}…</div>
              </div>
            ) : (
              <div className="h-16" />
            )}
            <div>{report.issuedBy}</div>
          </div>
          <div>
            <div className="font-semibold">Người phê duyệt kết quả</div>
            {s.lines.every((l) => l.approvalHash) ? (
              <div className="my-2 mx-auto w-fit rounded border border-emerald-600 px-3 py-1.5 text-[11px] text-emerald-800 text-left leading-snug">
                <div className="font-semibold">Đã ký điện tử phê duyệt</div>
                {s.lines.map((l) => (
                  <div key={l.resultCode} className="font-mono">{l.resultCode.slice(-5)} · {l.approvalSignedAt} · {l.approvalHash?.slice(0, 10)}…</div>
                ))}
              </div>
            ) : (
              <div className="h-16" />
            )}
            <div>{approvers.join(", ") || "—"}</div>
          </div>
        </div>

        {qrSvg && (
          <div className="mt-6 flex items-center gap-3 text-[10px] text-gray-600 break-inside-avoid">
            <div className="w-[88px] h-[88px] shrink-0" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <div>
              <div className="font-semibold text-[11px] text-black">Xác minh phiếu</div>
              <div>Quét mã QR để kiểm tra phiếu còn hiệu lực và nội dung không bị thay đổi.</div>
              <div className="font-mono break-all">{verifyUrl}</div>
              <div className="font-mono">SHA-256: {report.contentHash}</div>
            </div>
          </div>
        )}

        <footer className="mt-8 pt-2 border-t text-[10px] text-gray-500 flex justify-between">
          <span>{report.code}{report.revision > 0 ? ` · Sửa đổi lần ${report.revision}` : ""}</span>
          <span>Mã kết quả: {s.lines.map((l) => l.resultCode).join(", ")}</span>
        </footer>
      </article>
    </div>
  );
}
