import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { copyRateList, rateListStore } from "@/lib/modules/m2/data/settings";

export const dynamic = "force-dynamic";

/** Copy bảng giá / định mức kèm chỉ tiêu và khoản định mức. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const list = (await rateListStore.list()).find((l) => l.id === id);
  if (!list) return NextResponse.json({ error: "Không tìm thấy bảng" }, { status: 404 });
  const newId = await copyRateList(id);
  if (!newId) return NextResponse.json({ error: "Không copy được" }, { status: 500 });
  await logChange({ entity: "rate-lists", entityId: newId, action: "Copy", label: `${list.name} (bản sao)` });
  return NextResponse.json({ ok: true, item: { id: newId } }, { status: 201 });
}
