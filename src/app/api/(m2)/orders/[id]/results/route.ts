import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { orderLines } from "@/lib/modules/m2/data/orders";
import { saveLineEdits, type LineEdit } from "@/lib/modules/m2/data/line-entry";
import { orderOwnerGate } from "@/lib/modules/m2/data/order-access";
import { fieldOnlyEntry } from "@/lib/modules/m2/orders";

export const dynamic = "force-dynamic";

/** Lưu lưới nhập kết quả của đơn hàng (dòng ngoài phạm vi được phép bị bỏ qua). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const { lines = [] } = (await req.json()) as { lines?: LineEdit[] };
  // NV lấy mẫu chỉ nhập chỉ tiêu hiện trường của đơn mình đi quan trắc.
  let allowed = await orderLines(id);
  if (fieldOnlyEntry(gate.roles)) {
    const owner = await orderOwnerGate(id, "field");
    if (owner) return owner;
    allowed = allowed.filter((l) => l.lineKind === "Hiện trường");
  }
  const { saved, errors } = await saveLineEdits(lines, allowed, gate.actor.name, "theo đơn hàng");
  return NextResponse.json({ ok: errors.length === 0, saved, errors }, { status: errors.length ? 400 : 200 });
}
