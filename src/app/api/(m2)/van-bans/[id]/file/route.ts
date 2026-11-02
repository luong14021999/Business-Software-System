import { NextResponse } from "next/server";
import { authorize, signedIn } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { VAN_BAN_MAX_BYTES, getVanBanFile, setVanBanFile, vanBanStore } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Tải file đính kèm của hồ sơ. */
export async function GET(_req: Request, { params }: Ctx) {
  const denied = await signedIn();
  if (denied) return denied;
  const f = await getVanBanFile((await params).id);
  if (!f) return NextResponse.json({ error: "Hồ sơ chưa có file đính kèm" }, { status: 404 });
  return new Response(new Uint8Array(f.data), {
    headers: { "Content-Type": f.type, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}` },
  });
}

/** Tải lên (thay) file đính kèm, tối đa 10 MB. */
export async function POST(req: Request, { params }: Ctx) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const doc = (await vanBanStore.list()).find((d) => d.id === id);
  if (!doc) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  const file = (await req.formData()).get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Chưa chọn file" }, { status: 400 });
  if (file.size > VAN_BAN_MAX_BYTES) return NextResponse.json({ error: "File đính kèm tối đa 10 MB" }, { status: 400 });
  await setVanBanFile(id, file.name.slice(0, 200), file.type || "application/octet-stream", Buffer.from(await file.arrayBuffer()));
  await logChange({ entity: "van-bans", entityId: id, action: "Sửa", label: doc.number, changes: [{ field: "file đính kèm", old: doc.fileName, new: file.name }] });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const doc = (await vanBanStore.list()).find((d) => d.id === id);
  if (!doc) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  await setVanBanFile(id, "", "", null);
  await logChange({ entity: "van-bans", entityId: id, action: "Sửa", label: doc.number, changes: [{ field: "file đính kèm", old: doc.fileName, new: "" }] });
  return NextResponse.json({ ok: true });
}
