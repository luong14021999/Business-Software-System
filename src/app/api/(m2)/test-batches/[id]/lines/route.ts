import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { setLinesBatch, testBatchStore } from "@/lib/modules/m2/data/orders";

export const dynamic = "force-dynamic";

/** Đưa thêm / gỡ dòng kết quả khỏi mẻ. Dòng đã nộp duyệt hoặc đã thuộc mẻ khác không bị đổi. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const batch = (await testBatchStore.list()).find((b) => b.id === id);
  if (!batch) return NextResponse.json({ error: "Không tìm thấy mẻ" }, { status: 404 });
  const { add = [], remove = [] } = (await req.json()) as { add?: string[]; remove?: string[] };
  const added = await setLinesBatch(add, id);
  const removed = await setLinesBatch(remove, null);
  if (added || removed) {
    await logChange({ entity: "test-batches", entityId: id, action: "Sửa", label: batch.code, changes: [{ field: "dòng kết quả", old: removed ? `gỡ ${removed}` : "", new: added ? `thêm ${added}` : "" }] });
  }
  return NextResponse.json({ ok: true, added, removed, skipped: add.length - added + remove.length - removed });
}
