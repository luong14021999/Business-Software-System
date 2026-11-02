"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { btnPrimary, btnXs, link, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { STAGE_ACTIONS } from "@/lib/modules/m2/orders";

export type RequestRow = { id: string; no: number; code: string; orderId: string; customer: string; locationName: string; batches: string; stage: string };

const STAGE_TONE: Record<string, string> = {
  "Đợi lấy mẫu": "text-[#8b0000]",
  "Lấy mẫu": "text-[#ff4500]",
  "Nhận mẫu": "text-[#9400d3]",
  "Đang phân tích": "text-[#008080]",
  "Trả kết quả": "text-[#0000cd]",
  "Hủy mẫu": "text-muted-foreground line-through",
};

/** Danh sách yêu cầu (mẫu) của mọi đơn hàng như XaLab: chọn nhiều để Lấy mẫu / Nhận mẫu / Trả kết quả. */
export function RequestsTable({ rows }: { rows: RequestRow[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const all = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function stage(to: string) {
    if (!sel.size) return toast.error("Chưa chọn yêu cầu", "Đánh dấu ô vuông ở các yêu cầu cần chuyển trạng thái");
    setBusy(true);
    // API chuyển trạng thái theo đơn hàng → gom các yêu cầu đã chọn theo đơn.
    const byOrder = new Map<string, string[]>();
    for (const r of rows.filter((x) => sel.has(x.id))) byOrder.set(r.orderId, [...(byOrder.get(r.orderId) ?? []), r.id]);
    let updated = 0;
    const errors: string[] = [];
    for (const [orderId, sampleIds] of byOrder) {
      const res = await fetch(`/api/orders/${orderId}/stage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sampleIds, stage: to }) });
      const b = await res.json().catch(() => ({}));
      if (res.ok) updated += b.updated ?? 0;
      else errors.push(b.error ?? `HTTP ${res.status}`);
    }
    setBusy(false);
    if (updated) toast.success(`Đã chuyển ${updated} yêu cầu sang "${to}"`);
    if (errors.length) toast.error("Có yêu cầu không chuyển được", errors.join("; "));
    setSel(new Set());
    start(() => router.refresh());
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th className="w-6"><input type="checkbox" aria-label="Chọn tất cả" checked={all} onChange={() => setSel(all ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
              <th>Mã yêu cầu</th>
              <th>Khách hàng</th>
              <th>Vị trí lấy mẫu</th>
              <th>Mẻ thử nghiệm</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Không có yêu cầu nào</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.no}</td>
                <td><input type="checkbox" aria-label={`Chọn ${r.code}`} checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <td className="whitespace-nowrap"><Link href={`/orders/${r.orderId}/samples/${r.id}`} className={link}>{r.code}</Link></td>
                <td>{r.customer}</td>
                <td>{r.locationName}</td>
                <td>{r.batches}</td>
                <td className={STAGE_TONE[r.stage] ?? ""}>{r.stage}</td>
                <td className="whitespace-nowrap">
                  <Dropdown
                    className={btnXs}
                    label="Chức năng"
                    icon={<List className="h-3 w-3" aria-hidden />}
                    align="right"
                    items={[
                      { label: "Sửa yêu cầu", href: `/orders/${r.orderId}/samples/${r.id}` },
                      { label: "Thêm / bớt chỉ tiêu", href: `/orders/${r.orderId}/samples/${r.id}?tab=chi-tieu` },
                      { label: "Người lấy mẫu", href: `/orders/${r.orderId}/samples/${r.id}?tab=nguoi-lay-mau` },
                      { label: "Nhập/duyệt kết quả", href: `/orders/${r.orderId}/results#${r.code}` },
                      { label: "Đơn hàng", href: `/orders/${r.orderId}` },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {Object.entries(STAGE_ACTIONS).map(([label, to]) => (
          <button key={label} type="button" disabled={busy} onClick={() => stage(to)} className={btnPrimary}>{label}</button>
        ))}
      </div>
    </>
  );
}
