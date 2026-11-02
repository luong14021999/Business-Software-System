import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { checkMove, instrumentMoveStore, moveFields, moveItems, setMoveItems, type InstrumentMove, type MoveBody } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

/** Thêm phiếu nhập kho / xuất kho thiết bị. */
export async function POST(req: Request) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as MoveBody;
  const kind = b.kind === "xuat" ? "xuat" : "nhap";
  const err = await checkMove(b, kind);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const item = await instrumentMoveStore.create({ id: "", kind, createdAt: new Date().toISOString(), ...moveFields(b) } as InstrumentMove);
  await setMoveItems(item.id, b.equipmentIds ?? []);
  await logChange({ entity: "instrument-moves", entityId: item.id, action: "Thêm", label: `${kind === "xuat" ? "Xuất kho" : "Nhập kho"} ${b.movedAt} – ${(b.equipmentIds ?? []).length} thiết bị` });
  return NextResponse.json({ ok: true, item, items: await moveItems(item.id) }, { status: 201 });
}
