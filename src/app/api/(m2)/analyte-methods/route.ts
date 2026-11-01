import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { labelOf, logChange } from "@/lib/platform/data/change-log";
import { analyteMethodStore, setDefaultMethod, type AnalyteMethod } from "@/lib/modules/m2/data/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await analyteMethodStore.list();
  return NextResponse.json({ count: items.length, items });
}

/** Thêm phương pháp cho chỉ tiêu; phương pháp đầu tiên (hoặc được đánh dấu) thành mặc định. */
export async function POST(req: Request) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Partial<AnalyteMethod>;
  if (!b.analyteId) return NextResponse.json({ error: "Thiếu chỉ tiêu" }, { status: 400 });
  if (!b.method?.trim()) return NextResponse.json({ error: "Chọn phương pháp" }, { status: 400 });
  const mine = (await analyteMethodStore.list()).filter((m) => m.analyteId === b.analyteId);
  if (mine.some((m) => m.method === b.method!.trim())) return NextResponse.json({ error: "Chỉ tiêu đã có phương pháp này" }, { status: 409 });
  const item = await analyteMethodStore.create({
    id: "",
    analyteId: b.analyteId,
    method: b.method.trim(),
    isDefault: false,
    minValue: b.minValue ?? null,
    maxValue: b.maxValue ?? null,
    subcontractor: b.subcontractor ?? "",
  });
  if (b.isDefault || mine.length === 0) await setDefaultMethod(b.analyteId, item.id);
  await logChange({ entity: "analyte-methods", entityId: item.id, action: "Thêm", label: labelOf(item as unknown as Record<string, unknown>) });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
