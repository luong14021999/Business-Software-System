"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { btn, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { ORDER_DOC_KINDS, ORDER_KINDS, ORDER_STATUSES } from "@/lib/modules/m2/orders";
import { EntityFormDialog } from "@/components/crud/entity-form-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import type { Order } from "@/lib/modules/m2/data/orders";
import { fromLocalInputVN, toLocalInputVN } from "@/lib/platform/dates";
import { cn } from "@/lib/utils";

const TABS = ["Thông tin chính", "Nhân sự", "Tài liệu lưu trữ", "Thông tin khác"] as const;
const DELIVERY = ["Đến nhận", "Bưu điện", "Email", "Chuyển phát nhanh"];
const DATETIMES = ["fieldAt", "receivedAt", "dueAt", "internalDueAt", "deliveredAt"] as const;

type Opt = { id: string; name: string };
type Owned = { id: string; customerId: string; name: string; phone?: string };
type Doc = { id: string; kind: string; url: string; note: string; createdBy: string };

/** Thêm / sửa đơn hàng: loại đơn, khách hàng, các mốc ngày, nhân sự phụ trách. */
export function OrderForm({
  order,
  customers,
  staff,
  contacts = [],
  locations = [],
  documents = [],
}: {
  order?: Order;
  customers: Opt[];
  staff: string[];
  contacts?: Owned[];
  locations?: Owned[];
  documents?: Doc[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Thông tin chính");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Record<string, string>>(() => {
    const o = (order ?? {}) as Partial<Order>;
    const v: Record<string, string> = {
      name: o.name ?? "",
      kind: o.kind ?? "Mẫu gửi",
      customerId: o.customerId ?? "",
      contactId: o.contactId ?? "",
      locationId: o.locationId ?? "",
      contact: o.contact ?? "",
      location: o.location ?? "",
      contractNo: o.contractNo ?? "",
      requestingUnit: o.requestingUnit ?? "",
      disposeAt: (o.disposeAt ?? "").slice(0, 10),
      salesStaff: o.salesStaff ?? "",
      fieldStaff: o.fieldStaff ?? "",
      signer: o.signer ?? "",
      qaStaff: o.qaStaff ?? "",
      deliveryMethod: o.deliveryMethod ?? "",
      reportNo: o.reportNo ?? "",
      status: o.status ?? "Báo giá",
      note: o.note ?? "",
    };
    for (const k of DATETIMES) v[k] = toLocalInputVN(o[k]);
    return v;
  });
  const set = (k: string) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [applyAll, setApplyAll] = useState({ fieldAt: false, receivedAt: false, dueAt: false, disposeAt: false });
  const myContacts = contacts.filter((c) => c.customerId === f.customerId);
  const myLocations = locations.filter((l) => l.customerId === f.customerId);
  const pickContact = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    setF((p) => ({ ...p, contactId: id, contact: c ? [c.name, c.phone].filter(Boolean).join(" · ") : p.contact }));
  };
  const pickLocation = (id: string) => {
    const l = locations.find((x) => x.id === id);
    setF((p) => ({ ...p, locationId: id, location: l ? l.name : p.location }));
  };
  const applyBox = (k: keyof typeof applyAll) =>
    order && (
      <label className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground sm:ml-3 sm:mt-0">
        <input type="checkbox" checked={applyAll[k]} onChange={(e) => setApplyAll((a) => ({ ...a, [k]: e.target.checked }))} />Áp cho tất cả yêu cầu
      </label>
    );

  async function save(exit: boolean) {
    if (!f.name.trim()) {
      setTab("Thông tin chính");
      return toast.error("Thiếu tên đơn hàng");
    }
    setBusy(true);
    const body: Record<string, unknown> = { ...f, applyAll };
    for (const k of DATETIMES) body[k] = fromLocalInputVN(f[k]);
    const res = await fetch(order ? `/api/orders/${order.id}` : "/api/orders", {
      method: order ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không lưu được đơn hàng", b.error ?? `HTTP ${res.status}`);
    toast.success(order ? "Đã lưu đơn hàng" : `Đã tạo đơn hàng ${b.item?.code ?? ""}`);
    if (exit) router.push("/orders");
    else if (!order && b.item?.id) router.push(`/orders/${b.item.id}/split`);
    else router.refresh();
  }

  const row = "grid gap-1 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center sm:gap-4";
  const label = "text-sm font-bold text-[#333] sm:text-right";
  const people = (k: string, l: string) => (
    <label className={row}>
      <span className={label}>{l}</span>
      <select value={f[k]} onChange={set(k)} className={input}>
        <option value="">-chọn nhân sự-</option>
        {staff.map((s) => <option key={s}>{s}</option>)}
        {f[k] && !staff.includes(f[k]) && <option>{f[k]}</option>}
      </select>
    </label>
  );
  const dt = (k: string, l: string) => (
    <div className={row}>
      <label htmlFor={`o-${k}`} className={label}>{l}</label>
      <div className="flex flex-col sm:flex-row sm:items-center">
        <input id={`o-${k}`} type="datetime-local" value={f[k]} onChange={set(k)} className={`${input} sm:max-w-xs`} />
        {k in applyAll && applyBox(k as keyof typeof applyAll)}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1 text-sm font-bold">Loại đơn hàng</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {ORDER_KINDS.map((k) => (
            <label key={k} className="inline-flex items-center gap-1.5 text-sm">
              <input type="radio" name="kind" value={k} checked={f.kind === k} onChange={set("kind")} /> {k}
            </label>
          ))}
        </div>
      </fieldset>

      <div role="tablist" className="flex flex-wrap border-b border-[#ddd]">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("-mb-px rounded-t border px-4 py-2 text-sm", tab === t ? "border-[#ddd] border-b-white bg-white text-[#555]" : "border-transparent text-[#337ab7] hover:bg-[#eee]")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3 pt-1">
        {tab === "Thông tin chính" && (
          <>
            <label className={row}><span className={label}>Tên *</span><input value={f.name} onChange={set("name")} className={input} placeholder="VD: Đất ruộng HTX Đông Sơn đợt 1/2026" /></label>
            <label className={row}>
              <span className={label}>Khách hàng</span>
              <select value={f.customerId} onChange={(e) => setF((p) => ({ ...p, customerId: e.target.value, contactId: "", locationId: "" }))} className={input}>
                <option value="">— Chọn khách hàng —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div className={row}>
              <span className={label}>Liên lạc</span>
              <div className="flex flex-col gap-1 sm:flex-row">
                {myContacts.length > 0 && (
                  <select value={f.contactId} onChange={(e) => pickContact(e.target.value)} className={`${input} sm:max-w-xs`} aria-label="Chọn người liên hệ">
                    <option value="">Chọn liên lạc</option>
                    {myContacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <input value={f.contact} onChange={set("contact")} className={input} placeholder="Người liên hệ, điện thoại" aria-label="Liên lạc" />
              </div>
            </div>
            <div className={row}>
              <span className={label}>Địa điểm</span>
              <div className="flex flex-col gap-1 sm:flex-row">
                {myLocations.length > 0 && (
                  <select value={f.locationId} onChange={(e) => pickLocation(e.target.value)} className={`${input} sm:max-w-xs`} aria-label="Chọn địa điểm quan trắc">
                    <option value="">Chọn địa điểm</option>
                    {myLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                )}
                <input value={f.location} onChange={set("location")} className={input} placeholder="Địa điểm lấy mẫu / quan trắc" aria-label="Địa điểm" />
              </div>
            </div>
            {f.customerId && myContacts.length + myLocations.length === 0 && (
              <p className="text-xs text-muted-foreground sm:ml-[14rem]">Khách hàng chưa có liên hệ / địa điểm – thêm ở Khách hàng → Liên hệ, Địa điểm.</p>
            )}
            <label className={row}><span className={label}>Hợp đồng</span><input value={f.contractNo} onChange={set("contractNo")} className={input} placeholder="Số hợp đồng" /></label>
            <label className={row}><span className={label}>Đơn vị yêu cầu quan trắc</span><input value={f.requestingUnit} onChange={set("requestingUnit")} className={input} /></label>
            {dt("fieldAt", f.kind === "Mẫu gửi" ? "Ngày lấy mẫu" : "Ngày quan trắc")}
            {dt("receivedAt", "Ngày nhận mẫu")}
            {dt("dueAt", "Ngày trả kết quả")}
            <div className={row}>
              <label htmlFor="o-disposeAt" className={label}>Ngày hủy mẫu</label>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <input id="o-disposeAt" type="date" value={f.disposeAt} onChange={set("disposeAt")} className={`${input} sm:max-w-xs`} />
                {applyBox("disposeAt")}
              </div>
            </div>
            {dt("internalDueAt", "Ngày trả kết quả nội bộ")}
            {dt("deliveredAt", "Ngày trả kết quả thực tế")}
            {order && (
              <label className={row}>
                <span className={label}>Trạng thái</span>
                <select value={f.status} onChange={set("status")} className={`${input} sm:max-w-xs`}>
                  {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            )}
          </>
        )}
        {tab === "Nhân sự" && (
          <>
            {people("salesStaff", "Phụ trách kinh doanh")}
            {people("fieldStaff", "Phụ trách quan trắc / lấy mẫu")}
            {people("signer", "Người ký phiếu kết quả")}
            {people("qaStaff", "Cán bộ QA/QC")}
          </>
        )}
        {tab === "Tài liệu lưu trữ" && (
          order ? (
            <div className="space-y-2">
              <EntityFormDialog
                mode="add"
                endpoint="/api/order-documents"
                title="Thêm tài liệu lưu trữ"
                fields={[
                  { name: "kind", label: "Loại tài liệu", type: "select", options: [...ORDER_DOC_KINDS] },
                  { name: "url", label: "Đường dẫn (Google Drive, máy chủ tệp…)", required: true, full: true, placeholder: "https://…" },
                  { name: "note", label: "Ghi chú", full: true },
                  { name: "orderId", label: "Đơn hàng", type: "select", options: [{ value: order.id, label: order.code }], defaultValue: order.id },
                ]}
                trigger={<button type="button" className={btn}>Thêm file</button>}
              />
              <table className="w-full text-sm [&_td]:border-t [&_td]:border-[#ddd] [&_td]:px-2 [&_td]:py-2 [&_th]:border-b-2 [&_th]:border-[#ddd] [&_th]:px-2 [&_th]:py-2 [&_th]:text-left">
                <thead><tr><th>Loại tài liệu</th><th>Đường dẫn</th><th>Ghi chú</th><th>Người thêm</th><th /></tr></thead>
                <tbody>
                  {documents.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Chưa có tài liệu</td></tr>}
                  {documents.map((d) => (
                    <tr key={d.id}>
                      <td>{d.kind}</td>
                      <td className="max-w-[24rem] truncate"><a href={d.url} target="_blank" rel="noreferrer noopener" className="text-[#337ab7] hover:underline">{d.url}</a></td>
                      <td>{d.note}</td>
                      <td>{d.createdBy}</td>
                      <td className="text-right"><DeleteEntityButton entity="order-documents" id={d.id} label={d.kind} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Lưu đơn hàng trước rồi thêm tài liệu.</p>
          )
        )}
        {tab === "Thông tin khác" && (
          <>
            <label className={row}>
              <span className={label}>Hình thức trả kết quả</span>
              <select value={f.deliveryMethod} onChange={set("deliveryMethod")} className={`${input} sm:max-w-xs`}>
                <option value="">Chọn hình thức</option>
                {DELIVERY.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
            <label className={row}><span className={label}>Số phiếu kết quả</span><input value={f.reportNo} onChange={set("reportNo")} className={`${input} sm:max-w-xs`} /></label>
            <label className={row}><span className={label}>Mô tả / ghi chú</span><textarea value={f.note} onChange={set("note")} rows={3} className={`${input} h-auto py-2`} /></label>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-[#e5e5e5] pt-4">
        <Link href="/orders" className={btn} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></Link>
        <button type="button" disabled={busy} onClick={() => save(true)} className={btnPrimary}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Lưu &amp; thoát</button>
        <button type="button" disabled={busy} onClick={() => save(false)} className={btnPrimary}>{order ? "Lưu" : "Lưu & bóc tách"}</button>
        {order && (
          <>
            <Link href={`/orders/${order.id}/split`} className={btn}>Bóc tách</Link>
            <Link href={`/orders/${order.id}/samples`} className={btn}>Yêu cầu</Link>
            <Link href={`/orders/${order.id}/results`} className={btn}>Nhập/duyệt kết quả</Link>
            <Link href={`/orders/${order.id}/specs`} className={btn}>Quy chuẩn</Link>
            <Link href={`/orders/${order.id}/quote`} className={btn}>Báo giá</Link>
            <Link href={`/orders/${order.id}/debit`} className={btn}>Công nợ</Link>
            <Link href={`/order-print/${order.id}?loai=yeu-cau`} className={btn}>In phiếu yêu cầu</Link>
          </>
        )}
      </div>
    </div>
  );
}
