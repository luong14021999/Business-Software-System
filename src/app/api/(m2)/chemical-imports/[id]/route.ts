import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { chemicalImportStore, importHasExports, parseImportItems, saveImportItems, type ChemMoveBody } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Sửa lô nhập kho; dòng đã xuất kho không xóa được và không giảm dưới lượng đã xuất. */
export async function PATCH(req: Request, { params }: Ctx) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const before = (await chemicalImportStore.list()).find((x) => x.id === id);
  if (!before) return NextResponse.json({ error: "Không tìm thấy lô hàng" }, { status: 404 });
  const b = (await req.json()) as ChemMoveBody;
  if (!String(b.name ?? "").trim()) return NextResponse.json({ error: "Nhập tên lô hàng" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date ?? "")) return NextResponse.json({ error: "Nhập ngày nhập kho" }, { status: 400 });
  const items = parseImportItems(b.items);
  if (typeof items === "string") return NextResponse.json({ error: items }, { status: 400 });
  const err = await saveImportItems(id, items);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const item = await chemicalImportStore.update(id, { name: String(b.name).trim(), importedAt: b.date!, deliverer: String(b.deliverer ?? "").trim(), receiver: String(b.receiver ?? "").trim(), note: String(b.note ?? "").trim() });
  await logChange({ entity: "chemical-imports", entityId: id, action: "Sửa", label: `Lô ${b.name}` });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const before = (await chemicalImportStore.list()).find((x) => x.id === id);
  if (!before) return NextResponse.json({ error: "Không tìm thấy lô hàng" }, { status: 404 });
  if (await importHasExports(id)) return NextResponse.json({ error: "Lô hàng đã có hóa chất xuất kho, không xóa được" }, { status: 409 });
  await chemicalImportStore.remove(id);
  await logChange({ entity: "chemical-imports", entityId: id, action: "Xoá", label: `Lô ${before.name}` });
  return NextResponse.json({ ok: true });
}
