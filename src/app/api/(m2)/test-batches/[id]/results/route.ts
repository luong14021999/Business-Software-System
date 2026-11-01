import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { batchLines } from "@/lib/modules/m2/data/orders";
import { saveLineEdits, type LineEdit } from "@/lib/modules/m2/data/line-entry";

export const dynamic = "force-dynamic";

/** Lưu lưới nhập kết quả của mẻ thử nghiệm. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const { lines = [] } = (await req.json()) as { lines?: LineEdit[] };
  const { saved, errors } = await saveLineEdits(lines, await batchLines(id), gate.actor.name, "theo mẻ thử nghiệm");
  return NextResponse.json({ ok: errors.length === 0, saved, errors }, { status: errors.length ? 400 : 200 });
}
