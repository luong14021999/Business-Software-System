import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { batchTemplateStore } from "@/lib/modules/m2/data/settings";
import { testBatchStore } from "@/lib/modules/m2/data/orders";
import { nextBatchCode } from "@/lib/modules/m2/orders";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** Tạo mẻ thử nghiệm mới theo mẫu mẻ (phương pháp, người phân tích, thiết bị, hóa chất). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const t = (await batchTemplateStore.list()).find((x) => x.id === id);
  if (!t) return NextResponse.json({ error: "Không tìm thấy mẫu mẻ" }, { status: 404 });
  const existing = (await testBatchStore.list()).map((b) => b.code);
  const item = await testBatchStore.create({
    id: "",
    code: nextBatchCode(todayISO(), existing),
    method: t.method,
    analyst: t.analyst || gate.actor.name,
    instrumentCode: t.instrumentCode,
    chemicals: t.chemicals,
    startedAt: new Date().toISOString(),
    finishedAt: "",
    status: "Phân tích",
    note: t.note,
    createdBy: gate.actor.name,
    createdAt: new Date().toISOString(),
  });
  await logChange({ entity: "test-batches", entityId: item.id, action: "Thêm", label: `${item.code} (từ mẫu "${t.name}")` });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
