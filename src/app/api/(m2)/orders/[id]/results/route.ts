import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { orderLines } from "@/lib/modules/m2/data/orders";
import { EDITABLE, addAudit, updateResult } from "@/lib/modules/m2/data/results";
import { parseResultCell } from "@/lib/modules/m2/orders";
import type { ResultStatus } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

type Edit = { id: string; text?: string; method?: string; subcontractor?: string };

/**
 * Lưu lưới nhập kết quả của đơn hàng: chỉ các dòng đang nhập / bị trả lại.
 * Người lưu giá trị trở thành KTV của dòng (người duyệt sau phải khác người này).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const actor = gate.actor;
  const { id } = await params;
  const { lines = [] } = (await req.json()) as { lines?: Edit[] };
  const current = new Map((await orderLines(id)).map((l) => [l.id, l]));
  const errors: string[] = [];
  let saved = 0;
  for (const e of lines) {
    const before = current.get(e.id);
    if (!before) continue;
    if (!EDITABLE.includes(before.status as ResultStatus)) continue;
    const patch: Record<string, unknown> = {};
    if (e.method !== undefined && e.method !== before.method) patch.method = e.method;
    if (e.subcontractor !== undefined && e.subcontractor !== before.subcontractor) patch.subcontractor = e.subcontractor;
    if (e.text !== undefined) {
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
            technician: actor.name,
            started_at: new Date().toISOString(),
          });
        }
      }
    }
    if (!Object.keys(patch).length) continue;
    await updateResult(e.id, patch);
    await addAudit(e.id, {
      actor: actor.name,
      action: "Nhập kết quả theo đơn hàng",
      field: "Kết quả",
      oldValue: Number.isFinite(before.mean) ? `${before.prefix}${before.mean}` : before.prefix,
      newValue: e.text,
    });
    saved++;
  }
  return NextResponse.json({ ok: errors.length === 0, saved, errors }, { status: errors.length ? 400 : 200 });
}
