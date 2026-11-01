import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { orderSampleStore } from "@/lib/modules/m2/data/orders";
import { legacySampleStatus } from "@/lib/modules/m2/orders";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const RECEIVABLE = ["", "Đợi lấy mẫu", "Lấy mẫu"];

/** Tra cứu mẫu theo các mã quét được (để hiện trước khi nhận). */
export async function GET(req: Request) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const codes = new URL(req.url).searchParams.getAll("code").map((c) => c.trim().toUpperCase());
  const all = await orderSampleStore.list();
  const items = codes.map((c) => all.find((s) => s.code.toUpperCase() === c) ?? { code: c, missing: true });
  return NextResponse.json({ items });
}

/** Quét mã → chuyển các mẫu sang "Nhận mẫu" (ghi ngày nhận hôm nay). */
export async function POST(req: Request) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { codes = [] } = (await req.json()) as { codes?: string[] };
  const want = new Set(codes.map((c) => c.trim().toUpperCase()));
  const all = (await orderSampleStore.list()).filter((s) => want.has(s.code.toUpperCase()));
  const done: string[] = [];
  const skipped: string[] = [];
  for (const s of all) {
    if (!RECEIVABLE.includes(s.stage ?? "")) {
      skipped.push(`${s.code} (${s.stage})`);
      continue;
    }
    await orderSampleStore.update(s.id, { stage: "Nhận mẫu", status: legacySampleStatus("Nhận mẫu"), receivedAt: s.receivedAt || todayISO() });
    await logChange({ entity: "order-samples", entityId: s.id, action: "Sửa", label: s.code, changes: [{ field: "stage", old: s.stage, new: "Nhận mẫu" }] });
    done.push(s.code);
  }
  const missing = [...want].filter((c) => !all.some((s) => s.code.toUpperCase() === c));
  return NextResponse.json({ ok: true, done, skipped, missing });
}
