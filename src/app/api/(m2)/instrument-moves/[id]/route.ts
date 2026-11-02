import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { checkMove, instrumentMoveStore, moveFields, moveItems, setMoveItems, type MoveBody } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Sửa phiếu nhập / xuất kho thiết bị (thông tin + danh sách thiết bị). */
export async function PATCH(req: Request, { params }: Ctx) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const move = (await instrumentMoveStore.list()).find((m) => m.id === id);
  if (!move) return NextResponse.json({ error: "Không tìm thấy phiếu" }, { status: 404 });
  const b = (await req.json()) as MoveBody;
  const before = await moveItems(id);
  const err = await checkMove(b, move.kind, before);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const item = await instrumentMoveStore.update(id, moveFields(b));
  await setMoveItems(id, b.equipmentIds ?? []);
  await logChange({ entity: "instrument-moves", entityId: id, action: "Sửa", label: `${move.kind === "xuat" ? "Xuất kho" : "Nhập kho"} ${b.movedAt}`, changes: [{ field: "số thiết bị", old: String(before.length), new: String((b.equipmentIds ?? []).length) }] });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const move = (await instrumentMoveStore.list()).find((m) => m.id === id);
  if (!move) return NextResponse.json({ error: "Không tìm thấy phiếu" }, { status: 404 });
  await instrumentMoveStore.remove(id);
  await logChange({ entity: "instrument-moves", entityId: id, action: "Xoá", label: `${move.kind === "xuat" ? "Xuất kho" : "Nhập kho"} ${move.movedAt.slice(0, 10)}` });
  return NextResponse.json({ ok: true });
}
