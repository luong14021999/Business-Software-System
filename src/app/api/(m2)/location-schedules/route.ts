import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { locationScheduleStore } from "@/lib/modules/m2/data/catalogs";
import { locationStore } from "@/lib/modules/m2/data/order-extras";
import { dbQuery } from "@/lib/platform/db";

export const dynamic = "force-dynamic";

type Row = { fieldDay?: number | string | null; fieldMonth?: number | string | null };

/** Ghi đè lịch quan trắc định kỳ (ngày / tháng hằng năm) của một địa điểm. */
export async function PUT(req: Request) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const { locationId, rows = [] } = (await req.json()) as { locationId?: string; rows?: Row[] };
  const loc = (await locationStore.list()).find((l) => l.id === locationId);
  if (!loc) return NextResponse.json({ error: "Không tìm thấy địa điểm" }, { status: 404 });
  const clean = rows
    .map((r) => ({ d: Math.round(Number(r.fieldDay)), m: Math.round(Number(r.fieldMonth)) }))
    .filter((r) => r.d || r.m);
  const bad = clean.find((r) => !(r.d >= 1 && r.d <= 31) || !(r.m >= 1 && r.m <= 12));
  if (bad) return NextResponse.json({ error: "Ngày phải từ 1–31, tháng từ 1–12" }, { status: 400 });
  await dbQuery(`delete from public.location_schedules where location_id = $1`, [loc.id]);
  for (const r of clean) await locationScheduleStore.create({ id: "", locationId: loc.id, fieldDay: r.d, fieldMonth: r.m });
  await logChange({ entity: "location-schedules", entityId: loc.id, action: "Sửa", label: loc.name, changes: [{ field: "lịch quan trắc", old: "", new: clean.map((r) => `${r.d}/${r.m}`).join(", ") || "(trống)" }] });
  return NextResponse.json({ ok: true, saved: clean.length });
}
