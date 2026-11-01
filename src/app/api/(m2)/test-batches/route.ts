import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { labelOf, logChange } from "@/lib/platform/data/change-log";
import { testBatchStore, type TestBatch } from "@/lib/modules/m2/data/orders";
import { nextBatchCode } from "@/lib/modules/m2/orders";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await testBatchStore.list();
  return NextResponse.json({ count: items.length, items });
}

/** Thêm mẻ thử nghiệm: mã tự sinh theo tháng, người phân tích mặc định là người tạo. */
export async function POST(req: Request) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Partial<TestBatch>;
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
