"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { btn, btnPrimary, input } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { ORDER_KINDS, ORDER_STATUSES } from "@/lib/modules/m2/orders";
import type { Order } from "@/lib/modules/m2/data/orders";
import { fromLocalInputVN, toLocalInputVN } from "@/lib/platform/dates";
import { cn } from "@/lib/utils";

const TABS = ["Thông tin chính", "Nhân sự", "Thông tin khác"] as const;
const DELIVERY = ["Đến nhận", "Bưu điện", "Email", "Chuyển phát nhanh"];
const DATETIMES = ["fieldAt", "receivedAt", "dueAt", "internalDueAt", "deliveredAt"] as const;

type Opt = { id: string; name: string };

/** Thêm / sửa đơn hàng: loại đơn, khách hàng, các mốc ngày, nhân sự phụ trách. */
export function OrderForm({ order, customers, staff }: { order?: Order; customers: Opt[]; staff: string[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Thông tin chính");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Record<string, string>>(() => {
    const o = (order ?? {}) as Partial<Order>;
    const v: Record<string, string> = {
      name: o.name ?? "",
      kind: o.kind ?? "Mẫu gửi",
      customerId: o.customerId ?? "",
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

  async function save(exit: boolean) {
    if (!f.name.trim()) {
      setTab("Thông tin chính");
      return toast.error("Thiếu tên đơn hàng");
    }
    setBusy(true);
    const body: Record<string, string> = { ...f };
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
    <label className={row}>
      <span className={label}>{l}</span>
      <input type="datetime-local" value={f[k]} onChange={set(k)} className={`${input} sm:max-w-xs`} />
    </label>
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
              <select value={f.customerId} onChange={set("customerId")} className={input}>
                <option value="">— Chọn khách hàng —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className={row}><span className={label}>Liên lạc</span><input value={f.contact} onChange={set("contact")} className={input} placeholder="Người liên hệ, điện thoại" /></label>
            <label className={row}><span className={label}>Địa điểm</span><input value={f.location} onChange={set("location")} className={input} placeholder="Địa điểm lấy mẫu / quan trắc" /></label>
            <label className={row}><span className={label}>Hợp đồng</span><input value={f.contractNo} onChange={set("contractNo")} className={input} placeholder="Số hợp đồng" /></label>
            <label className={row}><span className={label}>Đơn vị yêu cầu quan trắc</span><input value={f.requestingUnit} onChange={set("requestingUnit")} className={input} /></label>
            {dt("fieldAt", f.kind === "Mẫu gửi" ? "Ngày lấy mẫu" : "Ngày quan trắc")}
            {dt("receivedAt", "Ngày nhận mẫu")}
            {dt("dueAt", "Ngày trả kết quả")}
            <label className={row}><span className={label}>Ngày hủy mẫu</span><input type="date" value={f.disposeAt} onChange={set("disposeAt")} className={`${input} sm:max-w-xs`} /></label>
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
          </>
        )}
      </div>
    </div>
  );
}
