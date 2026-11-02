import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/m2/reports/print-button";
import { labInfo } from "@/lib/modules/m2/accreditation";
import { getCustomers } from "@/lib/modules/m2/data/customers";
import { orderLines, orderSampleStore, orderStore } from "@/lib/modules/m2/data/orders";
import { priceResolver } from "@/lib/modules/m2/data/settings";
import { buildGrid } from "@/lib/modules/m2/data/grid";
import { PLAN_ITEM_KINDS, judge, parseResultCell, quoteItemsTotal, quoteLines, type QuoteItem } from "@/lib/modules/m2/orders";
import { orderQuoteStore, planItemStore, planOf } from "@/lib/modules/m2/data/order-extras";
import { fmtDateTimeVN, fmtDateVN, todayISO } from "@/lib/platform/dates";
import { fmtVND } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

const KINDS = { "yeu-cau": "PHIẾU YÊU CẦU PHÂN TÍCH", "ke-hoach": "KẾ HOẠCH QUAN TRẮC", "bao-gia": "BÁO GIÁ DỊCH VỤ PHÂN TÍCH", "ket-qua": "KẾT QUẢ PHÂN TÍCH TỔNG HỢP" } as const;
type Kind = keyof typeof KINDS;

/** Bản in theo đơn hàng (A4): phiếu yêu cầu phân tích, kế hoạch quan trắc, báo giá, kết quả tổng hợp. */
export default async function OrderPrintPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ loai?: string; v?: string }> }) {
  const { id } = await params;
  const { loai = "yeu-cau", v } = await searchParams;
  const kind: Kind = loai in KINDS ? (loai as Kind) : "yeu-cau";
  const [orders, customers, samples, lines] = await Promise.all([orderStore.list(), getCustomers(), orderSampleStore.list(), orderLines(id)]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const customer = customers.find((c) => c.id === order.customerId);
  const mine = samples.filter((s) => s.orderId === id).sort((a, b) => a.code.localeCompare(b.code));
  const cell = "border border-black px-1.5 py-1 align-top";

  let body: React.ReactNode = null;
  let quoteHead: { code: string; at: string } | null = null;
  let planLeader = "";
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
  } else if (kind === "ke-hoach") {
    const [plan, allItems] = await Promise.all([planOf(id), planItemStore.list()]);
    const items = allItems.filter((i) => i.orderId === id).sort((a, b) => a.sort - b.sort);
    const team = [
      ["Trưởng đoàn", plan?.leader],
      ["Giám sát", plan?.supervisor],
      ["Phó đoàn 1", plan?.deputy1],
      ["Phó đoàn 2", plan?.deputy2],
      ...(plan?.groups ?? []).map((g, i) => [`Nhóm ${i + 1}`, g.filter(Boolean).join(", ")]),
    ].filter(([, v]) => v) as [string, string][];
    const h2 = "mb-1 mt-3 font-bold";
    planLeader = plan?.leader ?? "";
    body = (
      <>
        <p className={h2}>1. Thời gian, phương tiện</p>
        <p>Từ ngày {plan?.startAt ? fmtDateVN(plan.startAt.slice(0, 10)) : "…"} đến ngày {plan?.endAt ? fmtDateVN(plan.endAt.slice(0, 10)) : "…"}{plan?.vehicle && ` · Phương tiện: ${plan.vehicle}`}</p>
        {plan?.note && <p>Ghi chú: {plan.note}</p>}
        <p className={h2}>2. Nhân sự quan trắc</p>
        <table className="w-full border-collapse text-[10.5pt]">
          <tbody>
            {team.length === 0 && <tr><td className={cell}>Chưa phân công</td></tr>}
            {team.map(([k, v]) => <tr key={k}><td className={`${cell} w-40 font-bold`}>{k}</td><td className={cell}>{v}</td></tr>)}
          </tbody>
        </table>
        <p className={h2}>3. Vị trí và chỉ tiêu quan trắc</p>
        <table className="w-full border-collapse text-[10.5pt]">
          <thead><tr><th className={cell}>TT</th><th className={cell}>Mã mẫu</th><th className={cell}>Vị trí</th><th className={cell}>Chỉ tiêu hiện trường</th><th className={cell}>Chỉ tiêu phòng TN</th><th className={cell}>Người lấy mẫu</th></tr></thead>
          <tbody>
            {mine.map((s, i) => {
              const ls = lines.filter((l) => l.sampleCode === s.code);
              const names = (field: boolean) => ls.filter((l) => (l.lineKind === "Hiện trường") === field).map((l) => (l.samplingTimes > 1 ? `${l.criterion} (×${l.samplingTimes})` : l.criterion)).join("; ");
              return (
                <tr key={s.id}>
                  <td className={`${cell} text-center`}>{i + 1}</td>
                  <td className={`${cell} whitespace-nowrap font-mono`}>{s.code}</td>
                  <td className={cell}>{s.locationName}{s.lat != null && s.lng != null && <div className="text-[9pt]">({s.lat}, {s.lng})</div>}</td>
                  <td className={cell}>{names(true)}</td>
                  <td className={cell}>{names(false)}</td>
                  <td className={cell}>{s.sampler}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {PLAN_ITEM_KINDS.map((k, n) => {
          const rows = items.filter((i) => i.kind === k);
          return (
            <div key={k}>
              <p className={h2}>{n + 4}. {k}</p>
              {rows.length === 0 ? <p className="italic">Không có</p> : (
                <table className="w-full border-collapse text-[10.5pt]">
                  <thead><tr><th className={cell}>TT</th><th className={cell}>Tên</th><th className={cell}>Số lượng</th><th className={cell}>Ghi chú</th></tr></thead>
                  <tbody>{rows.map((r, i) => <tr key={r.id}><td className={`${cell} text-center`}>{i + 1}</td><td className={cell}>{r.name}</td><td className={cell}>{r.quantity}</td><td className={cell}>{r.note}</td></tr>)}</tbody>
                </table>
              )}
            </div>
          );
        })}
      </>
    );
  } else if (kind === "bao-gia") {
    // Phiên bản báo giá: chọn theo ?v=, không có thì phiên bản đang áp dụng, rồi phiên bản mới nhất; chưa lưu thì tính từ bảng kê.
    const versions = (await orderQuoteStore.list()).filter((x) => x.orderId === id).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    const version = versions.find((x) => x.id === v) ?? versions.find((x) => x.code === order.quoteNo) ?? versions[0];
    const items: QuoteItem[] = version
      ? version.lines
      : quoteLines(lines, await priceResolver(order.priceListId)).map((l) => ({ label: l.criterion, unit: "mẫu", quantity: l.samples, unitPrice: l.unitPrice, group: l.matrix }));
    const discountPct = version ? version.discountPct : order.discountPct;
    const vatRate = version ? version.vatRate : order.vatRate;
    const t = quoteItemsTotal(items, discountPct, vatRate);
    quoteHead = version ? { code: version.code, at: version.quotedAt } : order.quoteNo ? { code: order.quoteNo, at: order.quotedAt } : null;
    body = (
      <>
        <table className="w-full border-collapse text-[10.5pt]">
          <thead><tr><th className={cell}>TT</th><th className={cell}>Chỉ tiêu / khoản mục</th><th className={cell}>Đơn vị</th><th className={cell}>Số lượng</th><th className={cell}>Đơn giá (đ)</th><th className={cell}>Thành tiền (đ)</th></tr></thead>
          <tbody>
            {items.map((l, i) => (
              <tr key={i}>
                <td className={`${cell} text-center`}>{i + 1}</td><td className={cell}>{l.label}{l.group && <span className="text-[9pt] italic"> ({l.group})</span>}</td><td className={cell}>{l.unit}</td>
                <td className={`${cell} text-right`}>{l.quantity.toLocaleString("vi-VN")}</td><td className={`${cell} text-right`}>{l.unitPrice.toLocaleString("vi-VN")}</td><td className={`${cell} text-right`}>{Math.round(l.quantity * l.unitPrice).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
            <tr><td className={`${cell} text-right`} colSpan={5}>Giá trị trước thuế</td><td className={`${cell} text-right`}>{t.sub.toLocaleString("vi-VN")}</td></tr>
            {t.discount > 0 && <tr><td className={`${cell} text-right`} colSpan={5}>Giảm giá {discountPct}%</td><td className={`${cell} text-right`}>−{t.discount.toLocaleString("vi-VN")}</td></tr>}
            <tr><td className={`${cell} text-right`} colSpan={5}>Thuế GTGT {vatRate || 0}%</td><td className={`${cell} text-right`}>{t.vat.toLocaleString("vi-VN")}</td></tr>
            <tr><td className={`${cell} text-right font-bold`} colSpan={5}>TỔNG CỘNG</td><td className={`${cell} text-right font-bold`}>{fmtVND(t.total)}</td></tr>
          </tbody>
        </table>
        {version?.note && <p className="mt-2 text-[10pt]">Ghi chú: {version.note}</p>}
        <p className="mt-2 text-[10pt] italic">Báo giá có hiệu lực 30 ngày kể từ ngày lập. Thời gian trả kết quả: {order.dueAt ? fmtDateVN(order.dueAt.slice(0, 10)) : "theo thỏa thuận"}.</p>
      </>
    );
  } else {
    const grid = await buildGrid(lines);
    body = (
      <>
        {grid.map((s) => (
          <div key={s.code} className="mb-4 break-inside-avoid">
            <div className="mb-1 font-bold">{s.code}: {s.locationName} <span className="font-normal">({s.type})</span></div>
            <table className="w-full border-collapse text-[10.5pt]">
              <thead><tr><th className={cell}>TT</th><th className={cell}>Chỉ tiêu</th><th className={cell}>Đơn vị</th><th className={cell}>Kết quả</th><th className={cell}>Phương pháp</th>{s.specName && <th className={cell}>{s.specName}</th>}{s.specName2 && <th className={cell}>{s.specName2}</th>}</tr></thead>
              <tbody>
                {s.lines.map((l, i) => {
                  const approved = l.status === "Đã duyệt";
                  const p = approved ? parseResultCell(l.text) : null;
                  const v1 = judge(p, l);
                  const v = v1 === "Vượt" || (l.lim2 && judge(p, l.lim2) === "Vượt") ? "Vượt" : v1;
                  return (
                    <tr key={l.id}>
                      <td className={`${cell} text-center`}>{i + 1}</td><td className={cell}>{l.printName}</td><td className={cell}>{l.unit}</td>
                      <td className={`${cell} text-right ${v === "Vượt" ? "font-bold" : ""}`}>{approved ? l.printText || "—" : <i className="text-[9pt]">chưa duyệt</i>}{v === "Vượt" && " *"}</td>
                      <td className={cell}>{l.method}</td>
                      {s.specName && <td className={cell}>{l.limitLabel}</td>}{s.specName2 && <td className={cell}>{l.lim2?.label ?? ""}</td>}
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
        {kind === "bao-gia" && quoteHead && <p className="text-center">Số: {quoteHead.code}{quoteHead.at && ` · ngày ${fmtDateVN(quoteHead.at.slice(0, 10))}`}</p>}
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
          <div>
            {kind === "yeu-cau" ? <><b>Đại diện khách hàng</b><div className="italic">(ký, ghi rõ họ tên)</div></> : null}
            {kind === "ke-hoach" ? <><b>Trưởng đoàn</b><div className="italic">(ký, ghi rõ họ tên)</div><div className="mt-14">{planLeader}</div></> : null}
          </div>
          <div><div className="italic">Thanh Hóa, ngày {fmtDateVN(todayISO())}</div><b>{kind === "ket-qua" ? "Người lập" : "Đại diện phòng thí nghiệm"}</b><div className="italic">(ký, ghi rõ họ tên)</div><div className="mt-14">{kind === "ket-qua" ? "" : order.signer || labInfo.manager}</div></div>
        </div>
        <p className="mt-6 border-t border-black pt-1 text-center text-[8.5pt]">{labInfo.accreditedName} – {labInfo.organization} · {labInfo.address} · ĐT {labInfo.phone} · {labInfo.email}</p>
      </div>
    </div>
  );
}
