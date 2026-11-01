import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { fillRateList, rateListStore } from "@/lib/modules/m2/data/settings";

export const dynamic = "force-dynamic";

/** Nạp mọi chỉ tiêu của một loại mẫu còn thiếu vào bảng giá / định mức. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const list = (await rateListStore.list()).find((l) => l.id === id);
  if (!list) return NextResponse.json({ error: "Không tìm thấy bảng" }, { status: 404 });
  const { sampleTypeId } = (await req.json()) as { sampleTypeId?: string };
  if (!sampleTypeId) return NextResponse.json({ error: "Chọn loại mẫu" }, { status: 400 });
  const added = await fillRateList(id, sampleTypeId, list.kind);
  return NextResponse.json({ ok: true, added });
}
