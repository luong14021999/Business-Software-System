"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { btnPrimary, table } from "@/components/m2/lab-ui/page";
import { toast } from "@/components/ui/toast";
import { fmtDateVN } from "@/lib/platform/dates";

export type PickLine = { id: string; sampleCode: string; criterion: string; method: string; status: string; receivedAt?: string; isQc?: boolean; isDuplicate?: boolean };

/** Bảng chọn dòng kết quả có ô đánh dấu + nút thao tác (đưa vào mẻ / gỡ khỏi mẻ). */
export function BatchLines({ batchId, lines, mode, canWrite }: { batchId: string; lines: PickLine[]; mode: "add" | "remove"; canWrite: boolean }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const all = lines.length > 0 && lines.every((l) => sel.has(l.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function apply() {
    if (!sel.size) return toast.error("Chưa chọn dòng nào");
    setBusy(true);
    const res = await fetch(`/api/test-batches/${batchId}/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "add" ? { add: [...sel] } : { remove: [...sel] }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error("Không thực hiện được", b.error ?? `HTTP ${res.status}`);
    toast.success(mode === "add" ? `Đã đưa ${b.added} dòng vào mẻ` : `Đã gỡ ${b.removed} dòng khỏi mẻ`, b.skipped ? `${b.skipped} dòng bỏ qua (đã nộp duyệt hoặc thuộc mẻ khác)` : undefined);
    setSel(new Set());
    start(() => router.refresh());
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              {canWrite && <th className="w-6"><input type="checkbox" aria-label="Chọn tất cả" checked={all} onChange={() => setSel(all ? new Set() : new Set(lines.map((l) => l.id)))} /></th>}
              <th>#</th><th>Mã mẫu</th><th>Ngày nhận mẫu</th><th>QA/QC</th><th>Mẫu lặp</th><th>Tên chỉ tiêu</th><th>Phương pháp</th><th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">{mode === "add" ? "Không có dòng phù hợp – đổi phương pháp hoặc khoảng ngày nhận mẫu" : "Mẻ chưa có mẫu"}</td></tr>}
            {lines.map((l, i) => (
              <tr key={l.id} className={sel.has(l.id) ? "bg-[#f5f5f5]" : undefined}>
                {canWrite && <td><input type="checkbox" aria-label={`Chọn ${l.sampleCode} ${l.criterion}`} checked={sel.has(l.id)} onChange={() => toggle(l.id)} /></td>}
                <td>{i + 1}</td>
                <td className="whitespace-nowrap font-mono">{l.sampleCode}</td>
                <td className="whitespace-nowrap">{fmtDateVN(l.receivedAt) || "—"}</td>
                <td>{l.isQc ? "✓" : ""}</td>
                <td>{l.isDuplicate ? "✓" : ""}</td>
                <td>{l.criterion}</td>
                <td className="text-xs">{l.method || "—"}</td>
                <td className="text-xs">{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canWrite && lines.length > 0 && (
        <button type="button" disabled={busy} onClick={apply} className={`${btnPrimary} mt-3`}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "add" ? `Đưa ${sel.size || ""} dòng đã chọn vào mẻ` : `Gỡ ${sel.size || ""} dòng đã chọn khỏi mẻ`}
        </button>
      )}
    </div>
  );
}
