import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderSampleStore } from "@/lib/modules/m2/data/orders";
import { SAMPLE_STAGES, legacySampleStatus } from "@/lib/modules/m2/orders";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** Chuyển trạng thái nhiều yêu cầu (mẫu) của đơn hàng: Lấy mẫu / Nhận mẫu / Trả kết quả… */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const { sampleIds = [], stage } = (await req.json()) as { sampleIds?: string[]; stage?: string };
  if (!stage || !(SAMPLE_STAGES as readonly string[]).includes(stage)) return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  if (!sampleIds.length) return NextResponse.json({ error: "Chọn ít nhất một yêu cầu" }, { status: 400 });
  const mine = (await orderSampleStore.list()).filter((s) => s.orderId === id && sampleIds.includes(s.id));
  for (const s of mine) {
    if (s.stage === stage) continue;
    const patch: Record<string, unknown> = { stage, status: legacySampleStatus(stage) };
    if (stage === "Lấy mẫu" && !s.sampledAt) patch.sampledAt = new Date().toISOString();
    if (stage === "Nhận mẫu" && !s.receivedAt) patch.receivedAt = todayISO();
    await orderSampleStore.update(s.id, patch);
    await logChange({ entity: "order-samples", entityId: s.id, action: "Sửa", label: s.code, changes: [{ field: "stage", old: s.stage, new: stage }] });
  }
  return NextResponse.json({ ok: true, updated: mine.length });
}
