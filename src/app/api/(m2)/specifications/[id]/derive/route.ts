import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { specificationStore } from "@/lib/modules/m2/data/orders";
import { deriveSpecLimits } from "@/lib/modules/m2/data/settings";
import { parseFactorFormula } from "@/lib/modules/m2/orders";

export const dynamic = "force-dynamic";

/** Tạo giới hạn của cột quy chuẩn này từ cột nguồn × công thức (VD "*0.9*1.2" cho Cmax = C × Kp × Kq). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const { sourceId, formula = "" } = (await req.json()) as { sourceId?: string; formula?: string };
  const specs = await specificationStore.list();
  const target = specs.find((s) => s.id === id);
  if (!target) return NextResponse.json({ error: "Không tìm thấy cột quy chuẩn" }, { status: 404 });
  if (!sourceId || sourceId === id || !specs.some((s) => s.id === sourceId)) return NextResponse.json({ error: "Chọn cột quy chuẩn nguồn khác cột này" }, { status: 400 });
  const f = parseFactorFormula(formula);
  if (!f) return NextResponse.json({ error: 'Công thức chỉ gồm các phép nhân / chia số, VD "*0,9*1,2"' }, { status: 400 });
  const n = await deriveSpecLimits(id, sourceId, f);
  await logChange({ entity: "specifications", entityId: id, action: "Sửa", label: target.name, changes: [{ field: "giới hạn", old: "", new: `${n} chỉ tiêu từ cột nguồn × ${formula}` }] });
  return NextResponse.json({ ok: true, count: n });
}
