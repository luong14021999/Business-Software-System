import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { vanBanStore, type VanBan } from "@/lib/modules/m2/data/manage";

export const dynamic = "force-dynamic";

/** Thêm hồ sơ (văn bản); file đính kèm tải lên riêng qua /api/van-bans/[id]/file. */
export async function POST(req: Request) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Partial<VanBan>;
  if (!String(b.number ?? "").trim()) return NextResponse.json({ error: "Nhập số văn bản" }, { status: 400 });
  const item = await vanBanStore.create({
    id: "",
    number: String(b.number).trim(),
    issuedAt: String(b.issuedAt ?? ""),
    issuer: String(b.issuer ?? "").trim(),
    summary: String(b.summary ?? "").trim(),
    note: String(b.note ?? "").trim(),
    assignees: Array.isArray(b.assignees) ? b.assignees.map(String) : [],
    active: b.active !== false,
    fileName: "",
    fileType: "",
  });
  await logChange({ entity: "van-bans", entityId: item.id, action: "Thêm", label: item.number });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
