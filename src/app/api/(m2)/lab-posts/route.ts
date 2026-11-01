import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { labPostStore } from "@/lib/modules/m2/data/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = (await labPostStore.list()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ count: items.length, items });
}

/** Đăng tin nội bộ: tối đa 1.000 ký tự, người đăng = tài khoản đang đăng nhập. */
export async function POST(req: Request) {
  const gate = await authorize("write.any");
  if (!gate.ok) return gate.response;
  const { body = "" } = (await req.json()) as { body?: string };
  const text = String(body).trim();
  if (!text) return NextResponse.json({ error: "Nhập nội dung tin" }, { status: 400 });
  if (text.length > 1000) return NextResponse.json({ error: "Tin tối đa 1.000 ký tự" }, { status: 400 });
  const item = await labPostStore.create({ id: "", author: gate.actor.name, body: text, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
