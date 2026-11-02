import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { chemicalLots, disposeLots, setLotNotes } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

/** Tồn kho hóa chất: tiêu hủy các lô đã chọn hoặc lưu ghi chú từng lô. */
export async function PATCH(req: Request) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as { dispose?: string[]; notes?: { id: string; note: string }[] };
  const lots = new Map((await chemicalLots()).map((l) => [l.id, l]));
  if (b.dispose?.length) {
    const ids = b.dispose.filter((id) => lots.has(id));
    await disposeLots(ids);
    for (const id of ids) {
      const l = lots.get(id)!;
      await logChange({ entity: "chemical-lots", entityId: id, action: "Tiêu hủy", label: `${l.chemical} – lô ${l.lotName}`, changes: [{ field: "lượng còn", old: String(l.remaining), new: "tiêu hủy" }] });
    }
    return NextResponse.json({ ok: true, disposed: ids.length });
  }
  const notes = (b.notes ?? []).filter((n) => lots.has(n.id)).map((n) => ({ id: n.id, note: String(n.note ?? "").trim().slice(0, 500) }));
  await setLotNotes(notes);
  for (const n of notes) {
    const l = lots.get(n.id)!;
    await logChange({ entity: "chemical-lots", entityId: n.id, action: "Sửa", label: `${l.chemical} – lô ${l.lotName}`, changes: [{ field: "ghi chú", old: l.note, new: n.note }] });
  }
  return NextResponse.json({ ok: true, saved: notes.length });
}
