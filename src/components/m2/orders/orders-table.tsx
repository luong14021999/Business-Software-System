"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, Printer } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { btnPrimary, btnXs, link, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { ORDER_KIND_SHORT, ORDER_STATUS_TONE } from "@/lib/modules/m2/orders";
import type { Order } from "@/lib/modules/m2/data/orders";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export type OrderRow = Order & { customerName: string; samples: number; lines: number; approved: number; sampleCodes: string[] };

const BULK = ["Quan trắc", "Phân tích", "Trả kết quả", "Thanh lý", "Hủy"] as const;

export function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const all = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function bulk(status: string) {
    if (!sel.size) return toast.error("Chưa chọn đơn hàng", "Đánh dấu ô vuông ở các đơn cần chuyển trạng thái");
    setBusy(true);
    const res = await fetch("/api/orders/bulk-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...sel], status }) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không chuyển được trạng thái", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã chuyển ${b.updated} đơn sang "${status}"`);
    setSel(new Set());
    start(() => router.refresh());
  }

  async function remove(r: OrderRow) {
    if (!confirm(`Xóa đơn hàng ${r.code} – ${r.name}? Các yêu cầu (mẫu) đã tạo vẫn được giữ.`)) return;
    const res = await fetch(`/api/orders/${r.id}`, { method: "DELETE" });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không xóa được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã xóa đơn hàng ${r.code}`);
    start(() => router.refresh());
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className="w-12">Mã</th>
              <th className="w-6"><input type="checkbox" aria-label="Chọn tất cả" checked={all} onChange={() => setSel(all ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
              <th>Tên</th>
              <th>Loại</th>
              <th>Ngày quan trắc</th>
              <th>Ngày trả kết quả</th>
              <th>Khách hàng</th>
              <th>Đơn vị yêu cầu quan trắc</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Chưa có đơn hàng</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className={sel.has(r.id) ? "bg-[#f5f5f5]" : undefined}>
                <td className="whitespace-nowrap">{r.code}</td>
                <td><input type="checkbox" aria-label={`Chọn ${r.code}`} checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <td>
                  <Link href={`/orders/${r.id}`} className={link}>{r.name}</Link>
                </td>
                <td>{ORDER_KIND_SHORT[r.kind] ?? r.kind}</td>
                <td className="whitespace-nowrap">{fmtDateTimeVN(r.fieldAt) || "—"}</td>
                <td className="whitespace-nowrap">{fmtDateTimeVN(r.dueAt) || "—"}</td>
                <td>{r.customerName || "—"}</td>
                <td>{r.requestingUnit}</td>
                <td className={ORDER_STATUS_TONE[r.status] ?? ""}>{r.status}</td>
                <td className="whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1">
                    <Dropdown
                      className={btnXs}
                      label="Chức năng"
                      icon={<List className="h-3 w-3" aria-hidden />}
                      align="right"
                      items={[
                        { label: "Quy chuẩn", href: `/orders/${r.id}/specs` },
                        { label: "Bóc tách", href: `/orders/${r.id}/split` },
                        { label: "Báo giá", href: `/orders/${r.id}/quote` },
                        { label: "Báo giá trước bóc tách", href: `/orders/${r.id}/quote-before` },
                        { label: "Công nợ", href: `/orders/${r.id}/debit` },
                        { label: "Nhân sự quan trắc", href: `/orders/${r.id}/plan` },
                        { label: "Vật tư - hóa chất", href: `/orders/${r.id}/plan#vat-tu` },
                        { label: "Bảo quản", href: `/orders/${r.id}/plan#bao-quan` },
                        { label: "Phân công/kết quả phân tích", href: `/orders/${r.id}/assign` },
                        { label: "Nhập/duyệt kết quả thử nghiệm", href: `/orders/${r.id}/results` },
                        { label: "Yêu cầu", href: `/orders/${r.id}/samples` },
                        { label: "Copy", href: `/orders/new?copy=${r.id}` },
                        { label: "Xóa", danger: true, onClick: () => remove(r) },
                      ]}
                    />
                    <Dropdown
                      className={btnXs}
                      label="In ấn"
                      icon={<Printer className="h-3 w-3" aria-hidden />}
                      align="right"
                      items={[
                        { label: "Kế hoạch quan trắc", href: `/order-print/${r.id}?loai=ke-hoach` },
                        { label: "Phiếu yêu cầu phân tích", href: `/order-print/${r.id}?loai=yeu-cau` },
                        { label: "Kết quả tổng hợp", href: `/order-print/${r.id}?loai=ket-qua` },
                        { label: "Báo giá", href: `/order-print/${r.id}?loai=bao-gia` },
                        { label: "Tem mã hóa mẫu", href: r.sampleCodes.length ? `/sample-labels?codes=${encodeURIComponent(r.sampleCodes.join(","))}` : `/orders/${r.id}/split` },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {BULK.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => bulk(s)} className={btnPrimary}>{s}</button>
        ))}
      </div>
    </>
  );
}
