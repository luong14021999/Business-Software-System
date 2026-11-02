import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { applyTypeSpecs, upsertTypeSpec } from "@/lib/modules/m2/data/order-extras";

export const dynamic = "force-dynamic";

/**
 * Quy chuẩn theo loại mẫu của đơn: { sampleTypeId, spec1Id, spec2Id } để lưu một loại;
 * { apply: true } để áp quy chuẩn cho tất cả yêu cầu (mẫu) của đơn.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const b = (await req.json()) as { sampleTypeId?: string; spec1Id?: string; spec2Id?: string; apply?: boolean };
  if (b.apply) {
    const n = await applyTypeSpecs(id);
    await logChange({ entity: "orders", entityId: id, action: "Sửa", label: "Áp quy chuẩn", changes: [{ field: "quy chuẩn", old: "", new: `${n} yêu cầu` }] });
    return NextResponse.json({ ok: true, applied: n });
  }
  if (!b.sampleTypeId) return NextResponse.json({ error: "Chọn loại mẫu" }, { status: 400 });
  await upsertTypeSpec(id, b.sampleTypeId, b.spec1Id ?? "", b.spec2Id ?? "");
  return NextResponse.json({ ok: true });
}
