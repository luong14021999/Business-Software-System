import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderLines, orderStore } from "@/lib/modules/m2/data/orders";
import { updateResult } from "@/lib/modules/m2/data/results";
import { LINE_KINDS } from "@/lib/modules/m2/orders";

export const dynamic = "force-dynamic";

type Assign = { id: string; analyst?: string; subcontractor?: string; method?: string; samplingTimes?: number; lineKind?: string };

/** Phân công: người phân tích, thầu phụ, phương pháp, số lần đo, loại (hiện trường / phòng TN) cho từng chỉ tiêu chưa duyệt. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const order = (await orderStore.list()).find((o) => o.id === id);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  const { lines = [] } = (await req.json()) as { lines?: Assign[] };
  const current = new Map((await orderLines(id)).map((l) => [l.id, l]));
  let saved = 0;
  const skipped: string[] = [];
  const changes: { field: string; old: string; new: string }[] = [];
  for (const a of lines) {
    const before = current.get(a.id);
    if (!before) continue;
    if (before.status === "Đã duyệt") {
      skipped.push(`${before.sampleCode} · ${before.criterion}`);
      continue;
    }
    const patch: Record<string, unknown> = {};
    if (a.analyst !== undefined && a.analyst.trim() !== before.analyst) patch.analyst = a.analyst.trim() || null;
    if (a.subcontractor !== undefined && a.subcontractor !== before.subcontractor) patch.subcontractor = a.subcontractor;
    if (a.method !== undefined && a.method.trim() !== before.method) patch.method = a.method.trim();
    if (a.samplingTimes !== undefined) {
      const n = Math.min(20, Math.max(1, Math.round(Number(a.samplingTimes) || 1)));
      if (n !== before.samplingTimes) patch.sampling_times = n;
    }
    if (a.lineKind !== undefined && a.lineKind !== before.lineKind && (LINE_KINDS as readonly string[]).includes(a.lineKind)) patch.line_kind = a.lineKind;
    if (!Object.keys(patch).length) continue;
    await updateResult(a.id, patch);
    if (patch.analyst !== undefined) changes.push({ field: `${before.sampleCode} · ${before.criterion}`, old: before.analyst, new: a.analyst ?? "" });
    saved++;
  }
  if (saved) {
    await logChange({
      entity: "orders",
      entityId: id,
      action: "Phân công",
      label: `${order.code} · ${order.name}`,
      changes: changes.length ? changes.slice(0, 50) : [{ field: "phân công", old: "", new: `${saved} chỉ tiêu` }],
    });
  }
  return NextResponse.json({ ok: true, saved, skipped });
}
