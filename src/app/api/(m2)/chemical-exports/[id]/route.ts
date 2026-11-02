import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { chemicalExportStore, parseExportItems, saveExportItems, type ChemMoveBody } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Sửa phiếu xuất kho hóa chất (ghi lại toàn bộ dòng, kiểm tra lượng còn). */
export async function PATCH(req: Request, { params }: Ctx) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  if (!(await chemicalExportStore.list()).some((x) => x.id === id)) return NextResponse.json({ error: "Không tìm thấy phiếu xuất" }, { status: 404 });
  const b = (await req.json()) as ChemMoveBody;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date ?? "")) return NextResponse.json({ error: "Nhập ngày xuất kho" }, { status: 400 });
  const items = parseExportItems(b.items);
  if (typeof items === "string") return NextResponse.json({ error: items }, { status: 400 });
  const err = await saveExportItems(id, items);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const item = await chemicalExportStore.update(id, { exportedAt: b.date!, deliverer: String(b.deliverer ?? "").trim(), receiver: String(b.receiver ?? "").trim(), note: String(b.note ?? "").trim() });
  await logChange({ entity: "chemical-exports", entityId: id, action: "Sửa", label: `Xuất kho ${b.date}` });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const before = (await chemicalExportStore.list()).find((x) => x.id === id);
  if (!before) return NextResponse.json({ error: "Không tìm thấy phiếu xuất" }, { status: 404 });
  await chemicalExportStore.remove(id);
  await logChange({ entity: "chemical-exports", entityId: id, action: "Xoá", label: `Xuất kho ${before.exportedAt.slice(0, 10)}` });
  return NextResponse.json({ ok: true });
}
