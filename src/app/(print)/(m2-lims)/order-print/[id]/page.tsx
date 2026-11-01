import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/m2/reports/print-button";
import { labInfo } from "@/lib/modules/m2/accreditation";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { orderLines, orderSampleStore, orderStore } from "@/lib/modules/m2/data/orders";
import { priceResolver } from "@/lib/modules/m2/data/settings";
import { buildGrid } from "@/lib/modules/m2/data/grid";
import { compareLimit, limitText, orderTotals, parseResultCell, quoteLines } from "@/lib/modules/m2/orders";
import { fmtDateTimeVN, fmtDateVN, todayISO } from "@/lib/platform/dates";
import { fmtVND } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

const KINDS = { "yeu-cau": "PHIẾU YÊU CẦU PHÂN TÍCH", "bao-gia": "BÁO GIÁ DỊCH VỤ PHÂN TÍCH", "ket-qua": "KẾT QUẢ PHÂN TÍCH TỔNG HỢP" } as const;
type Kind = keyof typeof KINDS;

/** Bản in theo đơn hàng (A4): phiếu yêu cầu phân tích, báo giá, kết quả tổng hợp. */
export default async function OrderPrintPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ loai?: string }> }) {
  const { id } = await params;
  const { loai = "yeu-cau" } = await searchParams;
  const kind: Kind = loai in KINDS ? (loai as Kind) : "yeu-cau";
  const [orders, customers, samples, lines] = await Promise.all([orderStore.list(), getCustomers(), orderSampleStore.list(), orderLines(id)]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const customer = customers.find((c) => c.id === order.customerId);
  const mine = samples.filter((s) => s.orderId === id).sort((a, b) => a.code.localeCompare(b.code));
  const cell = "border border-black px-1.5 py-1 align-top";

  let body: React.ReactNode = null;
  if (kind === "yeu-cau") {
    body = (
      <table className="w-full border-collapse text-[10.5pt]">
        <thead><tr><th className={cell}>TT</th><th className={cell}>Mã mẫu</th><th className={cell}>Vị trí / tên mẫu</th><th className={cell}>Loại mẫu</th><th className={cell}>Chỉ tiêu phân tích</th></tr></thead>
        <tbody>
          {mine.map((s, i) => (
            <tr key={s.id}>
              <td className={`${cell} text-center`}>{i + 1}</td>
              <td className={`${cell} whitespace-nowrap font-mono`}>{s.code}</td>
              <td className={cell}>{s.locationName}{s.customerSampleCode && ` (mã KH: ${s.customerSampleCode})`}</td>
              <td className={cell}>{s.type}</td>
              <td className={cell}>{lines.filter((l) => l.sampleCode === s.code).map((l) => l.criterion).join("; ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else if (kind === "bao-gia") {
    const q = quoteLines(lines, await priceResolver(order.priceListId));
    const t = orderTotals(order.amount || q.reduce((s, l) => s + l.amount, 0), order.discountPct, order.vatRate);
    body = (
      <>
        <table className="w-full border-collapse text-[10.5pt]">
          <thead><tr><th className={cell}>TT</th><th className={cell}>Chỉ tiêu</th><th className={cell}>Đơn vị</th><th className={cell}>Số mẫu</th><th className={cell}>Đơn giá (đ)</th><th className={cell}>Thành tiền (đ)</th></tr></thead>
          <tbody>
            {q.map((l, i) => (
              <tr key={i}>
                <td className={`${cell} text-center`}>{i + 1}</td><td className={cell}>{l.criterion}</td><td className={cell}>{l.unit}</td>
                <td className={`${cell} text-right`}>{l.samples}</td><td className={`${cell} text-right`}>{l.unitPrice.toLocaleString("vi-VN")}</td><td className={`${cell} text-right`}>{l.amount.toLocaleString("vi-VN")}</td>
              </tr>
            ))}
            <tr><td className={`${cell} text-right`} colSpan={5}>Giá trị trước thuế</td><td className={`${cell} text-right`}>{t.sub.toLocaleString("vi-VN")}</td></tr>
            {t.discount > 0 && <tr><td className={`${cell} text-right`} colSpan={5}>Giảm giá {order.discountPct}%</td><td className={`${cell} text-right`}>−{t.discount.toLocaleString("vi-VN")}</td></tr>}
            <tr><td className={`${cell} text-right`} colSpan={5}>Thuế GTGT {order.vatRate || 0}%</td><td className={`${cell} text-right`}>{t.vat.toLocaleString("vi-VN")}</td></tr>
            <tr><td className={`${cell} text-right font-bold`} colSpan={5}>TỔNG CỘNG</td><td className={`${cell} text-right font-bold`}>{fmtVND(t.total)}</td></tr>
          </tbody>
        </table>
        <p className="mt-2 text-[10pt] italic">Báo giá có hiệu lực 30 ngày kể từ ngày lập. Thời gian trả kết quả: {order.dueAt ? fmtDateVN(order.dueAt.slice(0, 10)) : "theo thỏa thuận"}.</p>
      </>
    );
  } else {
    const grid = await buildGrid(lines);
    body = (
      <>
        {grid.map((s) => (
          <div key={s.code} className="mb-4 break-inside-avoid">
            <div className="mb-1 font-bold">{s.code}: {s.locationName} <span className="font-normal">({s.type}{s.specName && ` – so với ${s.specName}`})</span></div>
            <table className="w-full border-collapse text-[10.5pt]">
              <thead><tr><th className={cell}>TT</th><th className={cell}>Chỉ tiêu</th><th className={cell}>Đơn vị</th><th className={cell}>Kết quả</th><th className={cell}>Phương pháp</th>{s.specName && <th className={cell}>Giới hạn</th>}</tr></thead>
              <tbody>
                {s.lines.map((l, i) => {
                  const approved = l.status === "Đã duyệt";
                  const p = approved ? parseResultCell(l.text) : null;
                  const v = p ? compareLimit(p.value, l.min, l.max, p.prefix) : "";
                  return (
                    <tr key={l.id}>
                      <td className={`${cell} text-center`}>{i + 1}</td><td className={cell}>{l.criterion}</td><td className={cell}>{l.unit}</td>
                      <td className={`${cell} text-right ${v === "Vượt" ? "font-bold" : ""}`}>{approved ? l.text || "—" : <i className="text-[9pt]">chưa duyệt</i>}{v === "Vượt" && " *"}</td>
                      <td className={cell}>{l.method}</td>
                      {s.specName && <td className={cell}>{limitText(l.min, l.max)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        <p className="text-[9.5pt] italic">(*) Vượt giới hạn quy chuẩn. Bản tổng hợp chỉ gồm giá trị đã được Trưởng phòng phê duyệt; không thay thế phiếu kết quả thử nghiệm chính thức.</p>
      </>
    );
  }

  return (
    <div className="py-6 print:py-0">
      <style>{`@page { size: A4; margin: 15mm 12mm; }`}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-2 px-4 print:hidden">
        <Link href={`/orders/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Đơn hàng {order.code}</Link>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {(Object.keys(KINDS) as Kind[]).map((k) => (
            <Link key={k} href={`/order-print/${id}?loai=${k}`} className={`inline-flex h-8 items-center rounded-md border px-2.5 text-xs ${k === kind ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{KINDS[k].toLowerCase().replace(/^./, (c) => c.toUpperCase())}</Link>
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
        {kind === "bao-gia" && order.quoteNo && <p className="text-center">Số: {order.quoteNo}{order.quotedAt && ` · ngày ${fmtDateVN(order.quotedAt.slice(0, 10))}`}</p>}
        <div className="mt-4 space-y-0.5">
          <p><b>Đơn hàng:</b> {order.code} – {order.name} ({order.kind})</p>
          <p><b>Khách hàng:</b> {customer?.name ?? "—"}{customer?.address && ` – ${customer.address}`}</p>
          {(order.contact || customer?.phone) && <p><b>Liên hệ:</b> {[order.contact, customer?.phone].filter(Boolean).join(" · ")}</p>}
          {order.location && <p><b>Địa điểm:</b> {order.location}</p>}
          <p><b>{order.kind === "Mẫu gửi" ? "Ngày lấy mẫu" : "Ngày quan trắc"}:</b> {order.fieldAt ? fmtDateTimeVN(order.fieldAt) : "—"} · <b>Hẹn trả kết quả:</b> {order.dueAt ? fmtDateTimeVN(order.dueAt) : "—"}</p>
          <p><b>Số mẫu:</b> {mine.length} · <b>Số chỉ tiêu:</b> {lines.length}</p>
        </div>
        <div className="mt-4">{body}</div>
        <div className="mt-8 grid grid-cols-2 gap-4 text-center text-[10.5pt]">
          <div>{kind === "yeu-cau" ? <><b>Đại diện khách hàng</b><div className="italic">(ký, ghi rõ họ tên)</div></> : null}</div>
          <div><div className="italic">Thanh Hóa, ngày {fmtDateVN(todayISO())}</div><b>{kind === "ket-qua" ? "Người lập" : "Đại diện phòng thí nghiệm"}</b><div className="italic">(ký, ghi rõ họ tên)</div><div className="mt-14">{kind === "ket-qua" ? "" : order.signer || labInfo.manager}</div></div>
        </div>
        <p className="mt-6 border-t border-black pt-1 text-center text-[8.5pt]">{labInfo.accreditedName} – {labInfo.organization} · {labInfo.address} · ĐT {labInfo.phone} · {labInfo.email}</p>
      </div>
    </div>
  );
}
