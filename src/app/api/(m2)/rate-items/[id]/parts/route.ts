import { NextResponse } from "next/server";
import { authorize, signedIn } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { NORM_CATEGORIES, normPartStore, rateItemStore, saveNormParts } from "@/lib/modules/m2/data/settings";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Các khoản định mức của một chỉ tiêu trong bảng định mức. */
export async function GET(_req: Request, { params }: Ctx) {
  const denied = await signedIn();
  if (denied) return denied;
  const { id } = await params;
  const items = (await normPartStore.list()).filter((p) => p.itemId === id).sort((a, b) => a.sort - b.sort);
  return NextResponse.json({ items });
}

/** Ghi đè các khoản định mức; đơn giá định mức của chỉ tiêu = tổng (định mức × đơn giá). */
export async function PUT(req: Request, { params }: Ctx) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const item = (await rateItemStore.list()).find((i) => i.id === id);
  if (!item) return NextResponse.json({ error: "Không tìm thấy chỉ tiêu trong bảng" }, { status: 404 });
  const { parts = [] } = (await req.json()) as { parts?: { category?: string; name?: string; quantity?: unknown; unitPrice?: unknown }[] };
  const clean = parts
    .map((p) => ({ category: String(p.category ?? ""), name: String(p.name ?? "").trim(), quantity: Number(String(p.quantity ?? "").replace(",", ".")) || 0, unitPrice: Number(String(p.unitPrice ?? "").replace(/[.\s](?=\d{3}(\D|$))/g, "").replace(",", ".")) || 0 }))
    .filter((p) => p.name);
  if (clean.some((p) => !(NORM_CATEGORIES as readonly string[]).includes(p.category))) return NextResponse.json({ error: "Loại khoản định mức không hợp lệ" }, { status: 400 });
  const total = await saveNormParts(id, clean);
  await logChange({ entity: "rate-items", entityId: id, action: "Cài đặt định mức", label: item.analyte, changes: [{ field: "đơn giá định mức", old: String(item.amount), new: String(clean.length ? total : item.amount) }] });
  return NextResponse.json({ ok: true, total });
}
