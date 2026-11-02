// Lưu kết quả gõ trên lưới (theo đơn hàng hoặc theo mẻ thử nghiệm) – dùng chung cho các API.
import { EDITABLE, addAudit, updateResult } from "@/lib/modules/m2/data/results";
import { averageReplicates, cellText, parseResultCell } from "@/lib/modules/m2/orders";
import type { OrderLine } from "@/lib/modules/m2/data/orders";
import type { ResultStatus } from "@/lib/mock-data";

/** `reps`: các lần đo khi chỉ tiêu đo nhiều lần – kết quả là trung bình, thay cho `text`. */
export type LineEdit = { id: string; text?: string; reps?: string[]; method?: string; subcontractor?: string };

/**
 * Chỉ ghi các dòng thuộc `allowed` đang nhập / bị trả lại.
 * Người lưu giá trị trở thành KTV của dòng (người duyệt sau phải khác người này).
 */
export async function saveLineEdits(edits: LineEdit[], allowed: OrderLine[], actor: string, source: string) {
  const current = new Map(allowed.map((l) => [l.id, l]));
  const errors: string[] = [];
  let saved = 0;
  for (const e of edits) {
    const before = current.get(e.id);
    if (!before || !EDITABLE.includes(before.status as ResultStatus)) continue;
    const patch: Record<string, unknown> = {};
    if (e.method !== undefined && e.method !== before.method) patch.method = e.method;
    if (e.subcontractor !== undefined && e.subcontractor !== before.subcontractor) patch.subcontractor = e.subcontractor;
    if (e.reps !== undefined) {
      const reps = e.reps.slice(0, 20).map((t) => String(t ?? "").trim());
      if (reps.join("|") !== before.reps.join("|")) {
        const avg = averageReplicates(reps);
        if (!avg && reps.some(Boolean)) {
          errors.push(`${before.sampleCode} · ${before.criterion}: có lần đo không phải số`);
          continue;
        }
        Object.assign(patch, {
          mean: avg && Number.isFinite(avg.value) ? avg.value : null,
          result_prefix: avg?.prefix || null,
          replicates: reps.map((text, i) => {
            const p = parseResultCell(text);
            return { id: i + 1, value: p && Number.isFinite(p.value) ? p.value : null, text };
          }),
          ...(avg ? { technician: actor, started_at: new Date().toISOString() } : {}),
        });
        e.text = avg ? `${cellText(avg)} (TB ${avg.n} lần đo: ${reps.filter(Boolean).join("; ")})` : "";
      }
    } else if (e.text !== undefined) {
      const text = e.text.trim();
      const shown = before.prefix === "KPH" ? "KPH" : Number.isFinite(before.mean) ? `${before.prefix}${before.mean}` : "";
      if (text !== shown) {
        if (!text) {
          Object.assign(patch, { mean: null, result_prefix: null, replicates: [] });
        } else {
          const p = parseResultCell(text);
          if (!p) {
            errors.push(`${before.sampleCode} · ${before.criterion}: "${text}" không phải số`);
            continue;
          }
          Object.assign(patch, {
            mean: Number.isFinite(p.value) ? p.value : null,
            result_prefix: p.prefix || null,
            replicates: Number.isFinite(p.value) ? [{ id: 1, value: p.value }] : [],
            technician: actor,
            started_at: new Date().toISOString(),
          });
        }
      }
    }
    if (!Object.keys(patch).length) continue;
    await updateResult(e.id, patch);
    await addAudit(e.id, {
      actor,
      action: `Nhập kết quả ${source}`,
      field: "Kết quả",
      oldValue: Number.isFinite(before.mean) ? `${before.prefix}${before.mean}` : before.prefix,
      newValue: e.text,
    });
    saved++;
  }
  return { saved, errors };
}
