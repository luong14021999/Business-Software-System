"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Loader2, Printer, X } from "lucide-react";
import { btn, btnPrimary, input, link } from "@/components/m2/lab-ui/page";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { toast } from "@/components/ui/toast";
import { DELIVERY_METHODS, ORDER_DOC_KINDS, ORDER_KINDS, ORDER_KIND_LABEL, REPORT_NO_KINDS } from "@/lib/modules/m2/orders";
import type { Order } from "@/lib/modules/m2/data/orders";
import { fromLocalInputVN, toLocalInputVN } from "@/lib/platform/dates";
import { cn } from "@/lib/utils";

const TABS = ["Thông tin chính", "Nhân sự", "Tài liệu lưu trữ", "Thông tin khác", "Đơn hàng so sánh"] as const;
const DATETIMES = ["fieldAt", "receivedAt", "dueAt", "internalDueAt", "deliveredAt"] as const;
const TEXTS = [
  "name", "kind", "customerId", "contactId", "locationId", "contact", "location", "contractId", "contractNo", "requestingUnitId", "requestingUnit",
  "salesStaff", "fieldStaff", "signer", "qaStaff", "deliveryMethod", "reportNo", "reportNoEn", "reportNoKind", "deliveryCount", "note",
  "growingAreaCode", "packingFacilityCode", "vehiclePlate", "trailerPlate", "containerNo", "sealNo", "industryId", "departmentId",
] as const;
const FLAGS = ["showFieldTime", "hideRequests", "activityReport"] as const;

type Opt = { id: string; name: string };
type Owned = { id: string; customerId: string; name: string; phone?: string };
type Doc = { id: string; kind: string; url: string; note: string; createdBy: string };

/**
 * Thêm / sửa đơn hàng như XaLab: dải "Loại đơn hàng", 5 tab (Thông tin chính, Nhân sự, Tài liệu lưu trữ, Thông tin khác,
 * Đơn hàng so sánh), các trường xếp 2 cột; cuối form [←][lịch sử][Lưu & thoát][Lưu] | In ấn.
 */
export function OrderForm({
  order,
  customers,
  staff,
  contacts = [],
  locations = [],
  documents = [],
  contracts = [],
  requestingUnits = [],
  industries = [],
  departments = [],
  otherOrders = [],
  copyFrom,
}: {
  order?: Order;
  /** "Copy" đơn hàng: điền sẵn thông tin của đơn khác (không chép ngày và số phiếu). */
  copyFrom?: Order;
  customers: Opt[];
  staff: string[];
  contacts?: Owned[];
  locations?: Owned[];
  documents?: Doc[];
  contracts?: Owned[];
  requestingUnits?: Opt[];
  industries?: Opt[];
  departments?: Opt[];
  /** Đơn hàng khác để chọn làm "đơn hàng so sánh". */
  otherOrders?: (Opt & { customerId: string })[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Thông tin chính");
  const [busy, setBusy] = useState<string | null>(null);
  const [f, setF] = useState<Record<string, string>>(() => {
    const o = (order ?? (copyFrom ? { ...copyFrom, name: `${copyFrom.name} (bản sao)`, reportNo: "", reportNoEn: "", fieldAt: "", receivedAt: "", dueAt: "", internalDueAt: "", deliveredAt: "", disposeAt: "" } : {})) as Partial<Order>;
    const v: Record<string, string> = {};
    for (const k of TEXTS) v[k] = String((o as Record<string, unknown>)[k] ?? "");
    v.kind ||= "Quan trắc môi trường";
    v.disposeAt = (o.disposeAt ?? "").slice(0, 10);
    for (const k of DATETIMES) v[k] = toLocalInputVN(o[k]);
    return v;
  });
  const [flags, setFlags] = useState(() => Object.fromEntries(FLAGS.map((k) => [k, Boolean(order?.[k])])) as Record<(typeof FLAGS)[number], boolean>);
  const [compare, setCompare] = useState<string[]>(() => Array.from({ length: 5 }, (_, i) => order?.compareOrderIds?.[i] ?? ""));
  const [applyAll, setApplyAll] = useState({ fieldAt: false, receivedAt: false, dueAt: false, disposeAt: false });
  const [docs, setDocs] = useState<Record<string, { url: string; note: string }>>({});
  const set = (k: string) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const mine = <T extends { customerId: string }>(xs: T[]) => xs.filter((x) => x.customerId === f.customerId);

  // Chọn từ danh sách → lưu cả khóa và chữ hiển thị (in trên phiếu).
  const pick = (idKey: string, textKey: string, xs: { id: string; name: string; phone?: string }[]) => (e: { target: { value: string } }) => {
    const x = xs.find((y) => y.id === e.target.value);
    setF((p) => ({ ...p, [idKey]: e.target.value, [textKey]: x ? [x.name, x.phone].filter(Boolean).join(" · ") : "" }));
  };

  async function save(exit: boolean) {
    if (!f.name.trim()) {
      setTab("Thông tin chính");
      return toast.error("Nhập tên đơn hàng");
    }
    setBusy(exit ? "exit" : "save");
    const body: Record<string, unknown> = { ...f, ...flags, compareOrderIds: compare.filter(Boolean), applyAll };
    for (const k of DATETIMES) body[k] = fromLocalInputVN(f[k]);
    const res = await fetch(order ? `/api/orders/${order.id}` : "/api/orders", {
      method: order ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error("Không lưu được đơn hàng", b.error ?? `HTTP ${res.status}`);
    toast.success(order ? "Đã lưu đơn hàng" : `Đã tạo đơn hàng ${b.item?.code ?? ""}`);
    if (exit) router.push("/orders");
    else if (!order && b.item?.id) router.push(`/orders/${b.item.id}`);
    else router.refresh();
  }

  async function addDoc(kind: string) {
    const d = docs[kind];
    if (!order || !d?.url.trim()) return toast.error("Nhập đường dẫn tài liệu");
    const res = await fetch("/api/order-documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, kind, url: d.url.trim(), note: d.note }) });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không thêm được tài liệu", b.error ?? `HTTP ${res.status}`);
    toast.success("Đã thêm tài liệu");
    setDocs((x) => ({ ...x, [kind]: { url: "", note: "" } }));
    router.refresh();
  }
  async function removeDoc(d: Doc) {
    if (!confirm(`Xóa tài liệu "${d.kind}"?`)) return;
    const res = await fetch(`/api/order-documents/${d.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Không xóa được tài liệu");
    router.refresh();
  }

  const label = "text-sm font-bold text-[#333] sm:text-right";
  const cell = "grid gap-1 sm:grid-cols-[165px_minmax(0,1fr)] sm:gap-x-[30px]";
  const field = (l: string, el: React.ReactNode, under?: React.ReactNode) => (
    <div className={cell}>
      <span className={cn(label, "sm:pt-2")}>{l}</span>
      <div>{el}{under}</div>
    </div>
  );
  const select = (k: string, opts: { id: string; name: string }[], empty: string, onChange = set(k)) => (
    <select value={f[k]} onChange={onChange} aria-label={empty} className={input}>
      <option value="">{empty}</option>
      {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
  const people = (k: string, l: string) =>
    field(
      l,
      <select value={f[k]} onChange={set(k)} aria-label={l} className={input}>
        <option value="">-chọn nhân sự-</option>
        {staff.map((s) => <option key={s}>{s}</option>)}
        {f[k] && !staff.includes(f[k]) && <option>{f[k]}</option>}
      </select>,
    );
  const text = (k: string, l: string) => field(l, <input value={f[k]} onChange={set(k)} aria-label={l} className={input} />);
  const flag = (k: (typeof FLAGS)[number], l: string) =>
    field(l, <input type="checkbox" checked={flags[k]} onChange={(e) => setFlags((x) => ({ ...x, [k]: e.target.checked }))} aria-label={l} className="mt-2 h-6 w-6" />);
  const applyBox = (k: keyof typeof applyAll) =>
    order && (
      <label className="mt-1.5 flex items-center gap-1.5 text-sm">
        <input type="checkbox" checked={applyAll[k]} onChange={(e) => setApplyAll((a) => ({ ...a, [k]: e.target.checked }))} />Áp cho tất cả yêu cầu
      </label>
    );
  const date = (k: string, l: string, type: "datetime-local" | "date" = "datetime-local") =>
    field(
      l,
      <div className="flex">
        <input type={type} value={f[k]} onChange={set(k)} aria-label={l} className={`${input} rounded-r-none bg-[#eee]`} />
        <button type="button" onClick={() => setF((p) => ({ ...p, [k]: "" }))} className={`${btn} -ml-px rounded-l-none`} aria-label={`Xóa ${l}`}><X className="h-4 w-4 stroke-[3]" /></button>
      </div>,
      k in applyAll ? applyBox(k as keyof typeof applyAll) : null,
    );
  const grid = "grid gap-x-[30px] gap-y-[15px] md:grid-cols-2";
  const sameCustomerOrders = otherOrders.filter((o) => o.id !== order?.id && (!f.customerId || o.customerId === f.customerId));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-[#bce8f1] bg-[#d9edf7] px-[15px] py-2.5 text-[#31708f]">
        <span className="w-[165px] text-right text-sm font-bold">Loại đơn hàng</span>
        {ORDER_KINDS.map((k) => (
          <label key={k} className="inline-flex items-center gap-1.5 text-sm">
            <input type="radio" name="kind" value={k} checked={f.kind === k} onChange={set("kind")} />{ORDER_KIND_LABEL[k] ?? k}
          </label>
        ))}
      </div>

      <div role="tablist" className="mb-5 flex flex-wrap border-b border-[#ddd]">
        {TABS.filter((t) => order || t !== "Tài liệu lưu trữ").map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("-mb-px rounded-t border px-[15px] py-2.5 text-sm", tab === t ? "border-[#ddd] border-b-white bg-white text-[#555]" : "border-transparent text-[#337ab7] hover:bg-[#eee]")}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Thông tin chính" && (
        <div className={grid}>
          {field("Tên", <input value={f.name} onChange={set("name")} aria-label="Tên" className={input} />)}
          {field("Khách hàng", select("customerId", customers, "Chọn khách hàng", (e) => setF((p) => ({ ...p, customerId: e.target.value, contactId: "", locationId: "", contractId: "" }))))}
          {field("Liên lạc", select("contactId", mine(contacts), "Chọn liên lạc", pick("contactId", "contact", contacts)))}
          {field("Địa điểm", select("locationId", mine(locations), "Chọn địa điểm", pick("locationId", "location", locations)))}
          {field("Hợp đồng", select("contractId", mine(contracts), "Chọn hợp đồng", pick("contractId", "contractNo", contracts)))}
          {field("Đơn vị yêu cầu quan trắc", select("requestingUnitId", requestingUnits, "Chọn đơn vị", pick("requestingUnitId", "requestingUnit", requestingUnits)))}
          {date("fieldAt", f.kind === "Mẫu gửi" ? "Ngày lấy mẫu" : "Ngày quan trắc")}
          {date("receivedAt", "Ngày nhận mẫu")}
          {date("dueAt", "Ngày trả kết quả")}
          {date("disposeAt", "Ngày hủy mẫu", "date")}
          {date("internalDueAt", "Ngày trả kết quả nội bộ")}
          {date("deliveredAt", "Ngày trả kết quả thực tế")}
        </div>
      )}
      {tab === "Nhân sự" && (
        <div className={grid}>
          {people("salesStaff", "Phụ trách kinh doanh")}
          {people("fieldStaff", "Phụ trách quan trắc")}
          {people("signer", "Người ký phiếu kết quả")}
          {people("qaStaff", "Cán bộ QA/QC")}
        </div>
      )}
      {tab === "Tài liệu lưu trữ" && order && (
        <table className="w-full text-sm [&_td]:border-t [&_td]:border-[#ddd] [&_td]:px-2 [&_td]:py-2 [&_td]:align-top [&_th]:border-b-2 [&_th]:border-[#ddd] [&_th]:px-2 [&_th]:py-2 [&_th]:text-left">
          <thead><tr><th className="w-48">Loại tài liệu</th><th>Google Drive</th><th>Ghi chú</th></tr></thead>
          <tbody>
            {ORDER_DOC_KINDS.map((kind) => (
              <tr key={kind}>
                <td className="font-bold">{kind}</td>
                <td>
                  {documents.filter((d) => d.kind === kind).map((d) => (
                    <div key={d.id} className="mb-1 flex items-center gap-2">
                      <a href={d.url} target="_blank" rel="noreferrer noopener" className={`${link} max-w-[26rem] truncate`}>{d.url}</a>
                      <button type="button" onClick={() => removeDoc(d)} className={`${link} inline-flex items-center gap-0.5 text-xs`}>Xóa file <X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <input value={docs[kind]?.url ?? ""} onChange={(e) => setDocs((x) => ({ ...x, [kind]: { url: e.target.value, note: x[kind]?.note ?? "" } }))} placeholder="https://drive.google.com/…" aria-label={`Đường dẫn ${kind}`} className={`${input} h-8`} />
                    <button type="button" onClick={() => addDoc(kind)} className={`${btn} h-8`}>Thêm file</button>
                  </div>
                </td>
                <td>
                  {documents.filter((d) => d.kind === kind && d.note).map((d) => <div key={d.id}>{d.note}</div>)}
                  <input value={docs[kind]?.note ?? ""} onChange={(e) => setDocs((x) => ({ ...x, [kind]: { url: x[kind]?.url ?? "", note: e.target.value } }))} aria-label={`Ghi chú ${kind}`} className={`${input} h-8`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === "Thông tin khác" && (
        <div className={grid}>
          {text("growingAreaCode", "Mã vùng trồng")}
          {text("packingFacilityCode", "Mã cơ sở đóng gói")}
          {text("vehiclePlate", "Biển số xe")}
          {text("trailerPlate", "Biển số Rmooc")}
          {text("containerNo", "Mã số container")}
          {text("sealNo", "Mã số niêm phong")}
          {flag("showFieldTime", "Hiển thị giờ quan trắc")}
          {flag("hideRequests", "Ẩn tất cả các yêu cầu")}
          {flag("activityReport", "Báo cáo hoạt động thử nghiệm")}
          {field("Ngành công nghiệp", select("industryId", industries, "Chọn ngành công nghiệp"))}
          {field("Phòng ban/Chi nhánh", select("departmentId", departments, "Chọn phòng ban/chi nhánh"))}
          {order && text("deliveryCount", "Lần trả kết quả")}
          {field("Hình thức trả kết quả", select("deliveryMethod", DELIVERY_METHODS.map((d) => ({ id: d, name: d })), "Chọn hình thức"))}
          {text("reportNo", "Số phiếu kết quả Tiếng Việt")}
          {text("reportNoEn", "Số phiếu kết quả Tiếng Anh")}
          {field("Loại số phiếu", select("reportNoKind", REPORT_NO_KINDS.map((d) => ({ id: d, name: d })), ""))}
          {field("Mô tả", <textarea value={f.note} onChange={set("note")} rows={3} aria-label="Mô tả" className={`${input} h-auto py-1.5`} />)}
        </div>
      )}
      {tab === "Đơn hàng so sánh" && (
        <div className={grid}>
          {compare.map((v, i) =>
            field(
              `Đơn hàng ${i + 1}`,
              <select value={v} onChange={(e) => setCompare((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Đơn hàng so sánh ${i + 1}`} className={input}>
                <option value="">Chọn đơn hàng</option>
                {sameCustomerOrders.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>,
            ),
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-1">
        <Link href="/orders" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4 stroke-[3]" /></Link>
        {order && <Link href={`/orders/${order.id}/history`} className={btn} aria-label="Lịch sử thay đổi" title="Lịch sử thay đổi"><Clock className="h-4 w-4" /></Link>}
        <button type="button" disabled={Boolean(busy)} onClick={() => save(true)} className={btnPrimary}>{busy === "exit" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
        <button type="button" disabled={Boolean(busy)} onClick={() => save(false)} className={btnPrimary}>{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}Lưu</button>
        {order && (
          <>
            <span className="mx-1 text-[#333]">|</span>
            <Dropdown
              className={btn}
              label={<><Printer className="h-4 w-4" aria-hidden />In ấn</>}
              items={[
                { label: "Phiếu yêu cầu phân tích", href: `/order-print/${order.id}?loai=yeu-cau` },
                { label: "Kế hoạch quan trắc", href: `/order-print/${order.id}?loai=ke-hoach` },
                { label: "Báo giá", href: `/order-print/${order.id}?loai=bao-gia` },
                { label: "Kết quả tổng hợp", href: `/order-print/${order.id}?loai=ket-qua` },
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
}
