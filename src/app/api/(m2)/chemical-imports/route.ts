import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { chemicalImportStore, parseImportItems, saveImportItems, type ChemMoveBody } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

/** Thêm lô hóa chất nhập kho (thông tin lô + các dòng hóa chất). */
export async function POST(req: Request) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as ChemMoveBody;
  if (!String(b.name ?? "").trim()) return NextResponse.json({ error: "Nhập tên lô hàng" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date ?? "")) return NextResponse.json({ error: "Nhập ngày nhập kho" }, { status: 400 });
  const items = parseImportItems(b.items);
  if (typeof items === "string") return NextResponse.json({ error: items }, { status: 400 });
  const item = await chemicalImportStore.create({ id: "", name: String(b.name).trim(), importedAt: b.date!, deliverer: String(b.deliverer ?? "").trim(), receiver: String(b.receiver ?? "").trim(), note: String(b.note ?? "").trim(), createdAt: new Date().toISOString() });
  const err = await saveImportItems(item.id, items);
  if (err) {
    await chemicalImportStore.remove(item.id);
    return NextResponse.json({ error: err }, { status: 400 });
  }
  await logChange({ entity: "chemical-imports", entityId: item.id, action: "Thêm", label: `Lô ${item.name} – ${items.length} hóa chất` });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
