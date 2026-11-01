import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { labPostStore } from "@/lib/modules/m2/data/orders";

export const dynamic = "force-dynamic";

/** Chỉ người đăng (hoặc Quản trị) xóa được tin. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.any");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const post = (await labPostStore.list()).find((p) => p.id === id);
  if (!post) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (post.author !== gate.actor.name && !gate.roles.includes("Quản trị")) return NextResponse.json({ error: "Chỉ người đăng được xóa tin" }, { status: 403 });
  await labPostStore.remove(id);
  return NextResponse.json({ ok: true });
}
