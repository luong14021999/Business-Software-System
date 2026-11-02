import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { labelOf, logChange } from "@/lib/platform/data/change-log";
import { testBatchStore, type TestBatch } from "@/lib/modules/m2/data/orders";
import { nextBatchCode } from "@/lib/modules/m2/orders";
import { batchTemplateStore } from "@/lib/modules/m2/data/settings";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await testBatchStore.list();
  return NextResponse.json({ count: items.length, items });
}

/** Thêm mẻ thử nghiệm: mã tự sinh theo tháng, người phân tích mặc định là người tạo; có thể lấy sẵn từ template. */
export async function POST(req: Request) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const body = (await req.json()) as Partial<TestBatch> & { templateId?: string };
  // Chọn template mẻ thử nghiệm: lấy sẵn phương pháp, người phân tích, thiết bị, hóa chất (ô đã nhập vẫn ưu tiên).
  const tpl = body.templateId ? (await batchTemplateStore.list()).find((t) => t.id === body.templateId) : undefined;
  const b: Partial<TestBatch> = { ...body, method: body.method || tpl?.method, analyst: body.analyst || tpl?.analyst, instrumentCode: body.instrumentCode || tpl?.instrumentCode, chemicals: body.chemicals || tpl?.chemicals };
  const existing = (await testBatchStore.list()).map((x) => x.code);
  const item = await testBatchStore.create({
    id: "",
    code: nextBatchCode(todayISO(), existing),
    method: b.method ?? "",
    analyst: b.analyst || gate.actor.name,
    instrumentCode: b.instrumentCode ?? "",
    chemicals: b.chemicals ?? "",
    startedAt: b.startedAt || new Date().toISOString(),
    finishedAt: b.finishedAt ?? "",
    status: "Phân tích",
    note: b.note ?? "",
    createdBy: gate.actor.name,
    createdAt: new Date().toISOString(),
  });
  await logChange({ entity: "test-batches", entityId: item.id, action: "Thêm", label: labelOf(item as unknown as Record<string, unknown>) });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
