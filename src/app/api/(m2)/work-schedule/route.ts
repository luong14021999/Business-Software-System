import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { workScheduleStore, type WorkItem } from "@/lib/modules/m2/data/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await workScheduleStore.list();
  return NextResponse.json({ count: items.length, items });
}

/** Thêm việc vào lịch công tác (một nhân viên, một ngày). */
export async function POST(req: Request) {
  const gate = await authorize("write.any");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Partial<WorkItem>;
  if (!b.staffName?.trim()) return NextResponse.json({ error: "Chọn nhân viên" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.day ?? "")) return NextResponse.json({ error: "Chọn ngày" }, { status: 400 });
  if (!b.title?.trim()) return NextResponse.json({ error: "Nhập nội dung công việc" }, { status: 400 });
  const item = await workScheduleStore.create({
    id: "",
    staffName: b.staffName.trim(),
    day: b.day!,
    kind: b.kind || "Kế hoạch quan trắc",
    title: b.title.trim(),
    hours: b.hours == null || String(b.hours) === "" ? null : Number(b.hours),
    orderId: b.orderId ?? "",
    note: b.note ?? "",
    createdBy: gate.actor.name,
  });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
