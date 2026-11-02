import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { copySpecification } from "@/lib/modules/m2/data/settings";
import { specById } from "@/lib/modules/m2/data/specs";

export const dynamic = "force-dynamic";

/** Copy cột quy chuẩn kèm toàn bộ giới hạn chỉ tiêu. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const spec = await specById(id);
  if (!spec) return NextResponse.json({ error: "Không tìm thấy cột quy chuẩn" }, { status: 404 });
  const newId = await copySpecification(id);
  if (!newId) return NextResponse.json({ error: "Không copy được" }, { status: 500 });
  await logChange({ entity: "specifications", entityId: newId, action: "Copy", label: `${spec.columnName || spec.name} (bản sao)` });
  return NextResponse.json({ ok: true, item: { id: newId } }, { status: 201 });
}
