"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { List } from "lucide-react";
import { Dropdown } from "@/components/m2/lab-ui/dropdown";
import { btnPrimary, btnXs, table } from "@/components/m2/lab-ui/page";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { toast } from "@/components/ui/toast";
import { STAGE_ACTIONS } from "@/lib/modules/m2/orders";
import type { OrderSample } from "@/lib/modules/m2/data/orders";
import { fmtDateVN } from "@/lib/platform/dates";

export type SampleRow = OrderSample & { specName: string; lines: number; entered: number };

const STAGE_TONE: Record<string, string> = {
  "Đợi lấy mẫu": "text-orange-600",
  "Lấy mẫu": "text-orange-700",
  "Nhận mẫu": "text-teal-700",
  "Đang phân tích": "text-teal-700",
  "Trả kết quả": "text-blue-700",
  "Hủy mẫu": "text-muted-foreground line-through",
};

/** Danh sách yêu cầu (mẫu) của đơn hàng: chọn nhiều để chuyển trạng thái, sửa / xóa từng mẫu. */
export function OrderSamplesTable({ orderId, rows, editFields }: { orderId: string; rows: SampleRow[]; editFields: CrudField[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const all = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function stage(to: string) {
    if (!sel.size) return toast.error("Chưa chọn yêu cầu", "Đánh dấu ô vuông ở các mẫu cần chuyển trạng thái");
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/stage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sampleIds: [...sel], stage: to }) });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không chuyển được trạng thái", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã chuyển ${b.updated} yêu cầu sang "${to}"`);
    setSel(new Set());
    start(() => router.refresh());
  }

  async function remove(r: SampleRow) {
    if (!confirm(`Xóa yêu cầu ${r.code} (${r.locationName})?`)) return;
    const res = await fetch(`/api/order-samples/${r.id}`, { method: "DELETE" });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không xóa được", b.error ?? `HTTP ${res.status}`);
    toast.success(`Đã xóa ${r.code}`);
    start(() => router.refresh());
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className="w-6"><input type="checkbox" aria-label="Chọn tất cả" checked={all} onChange={() => setSel(all ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
              <th>Mã yêu cầu</th>
              <th>Vị trí lấy mẫu</th>
              <th>Loại mẫu</th>
              <th>Quy chuẩn</th>
              <th>Kết quả</th>
              <th>Ngày nhận mẫu</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Đơn hàng chưa có yêu cầu – dùng Bóc tách để tạo</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className={sel.has(r.id) ? "bg-[#f5f5f5]" : undefined}>
                <td><input type="checkbox" aria-label={`Chọn ${r.code}`} checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <td className="whitespace-nowrap font-mono">
                  {r.code}
                  {(r.isQc || r.isDuplicate) && <div className="font-sans text-xs text-muted-foreground">{[r.isQc && "QA/QC", r.isDuplicate && "mẫu lặp"].filter(Boolean).join(" · ")}</div>}
                </td>
                <td>{r.locationName}{r.customerSampleCode && <div className="text-xs text-muted-foreground">Mã của khách: {r.customerSampleCode}</div>}</td>
                <td>{r.type}</td>
                <td className="text-xs">{r.specName || "—"}</td>
                <td className="whitespace-nowrap">{r.entered}/{r.lines}</td>
                <td className="whitespace-nowrap">{fmtDateVN(r.receivedAt) || "—"}</td>
                <td className={STAGE_TONE[r.stage] ?? ""}>{r.stage || "—"}</td>
                <td className="whitespace-nowrap">
                  <div className="flex items-start gap-1">
                  <EntityFormDialog
                    mode="edit"
                    endpoint="/api/order-samples"
                    id={r.id}
                    title={`Sửa yêu cầu ${r.code}`}
                    fields={editFields}
                    initial={r}
                    trigger={<button type="button" className={btnXs}>Sửa</button>}
                  />
                  <Dropdown
                    className={btnXs}
                    label="Chức năng"
                    icon={<List className="h-3 w-3" aria-hidden />}
                    align="right"
                    items={[
                      { label: "Nhập/duyệt kết quả", href: `/orders/${orderId}/results#${r.code}` },
                      { divider: true, label: "" },
                      { label: "Xóa", danger: true, onClick: () => remove(r) },
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
        {Object.entries(STAGE_ACTIONS).map(([label, to]) => (
          <button key={label} type="button" disabled={busy} onClick={() => stage(to)} className={btnPrimary}>{label}</button>
        ))}
        <button type="button" disabled={busy} onClick={() => stage("Lưu mẫu")} className={btnPrimary}>Lưu mẫu</button>
        <button type="button" disabled={busy} onClick={() => stage("Hủy mẫu")} className={btnPrimary}>Hủy mẫu</button>
      </div>
    </>
  );
}
