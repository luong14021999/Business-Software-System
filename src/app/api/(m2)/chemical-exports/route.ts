import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { chemicalExportStore, parseExportItems, saveExportItems, type ChemMoveBody } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

/** Thêm phiếu xuất kho hóa chất; không cho xuất quá lượng còn của lô. */
export async function POST(req: Request) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as ChemMoveBody;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date ?? "")) return NextResponse.json({ error: "Nhập ngày xuất kho" }, { status: 400 });
  const items = parseExportItems(b.items);
  if (typeof items === "string") return NextResponse.json({ error: items }, { status: 400 });
  const item = await chemicalExportStore.create({ id: "", exportedAt: b.date!, deliverer: String(b.deliverer ?? "").trim(), receiver: String(b.receiver ?? "").trim(), note: String(b.note ?? "").trim(), createdAt: new Date().toISOString() });
  const err = await saveExportItems(item.id, items);
  if (err) {
    await chemicalExportStore.remove(item.id);
    return NextResponse.json({ error: err }, { status: 400 });
  }
  await logChange({ entity: "chemical-exports", entityId: item.id, action: "Thêm", label: `Xuất kho ${b.date} – ${items.length} dòng` });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
