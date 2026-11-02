import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { customerProfileStore } from "@/lib/modules/m2/data/customers";
import { locationStore } from "@/lib/modules/m2/data/order-extras";
import { locationScheduleStore } from "@/lib/modules/m2/data/catalogs";
import { scheduleDates } from "@/lib/modules/m2/customer-forms";
import { csvRow } from "@/lib/platform/format";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** "Tần suất quan trắc": các đợt quan trắc định kỳ của địa điểm khách hàng trong khoảng ngày, xuất CSV. */
export async function GET(req: Request) {
  const gate = await authorize("view.customers");
  if (!gate.ok) return gate.response;
  const u = new URL(req.url);
  const from = u.searchParams.get("from") ?? "";
  const to = u.searchParams.get("to") ?? "";
  const customerId = u.searchParams.get("customerId") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to < from) return NextResponse.json({ error: "Chọn khoảng ngày hợp lệ" }, { status: 400 });
  const [customers, locations, schedules] = await Promise.all([customerProfileStore.list(), locationStore.list(), locationScheduleStore.list()]);
  const name = new Map(customers.map((c) => [c.id, c.name]));
  const rows: (string | number)[][] = [];
  for (const l of locations.filter((x) => !customerId || x.customerId === customerId)) {
    for (const d of scheduleDates(schedules.filter((s) => s.locationId === l.id), from, to)) rows.push([d, name.get(l.customerId) ?? "", l.name]);
  }
  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const csv = [csvRow(["#", "Ngày quan trắc", "Khách hàng", "Địa điểm"]), ...rows.map((r, i) => csvRow([i + 1, fmtDateVN(String(r[0])), r[1], r[2]]))].join("\r\n");
  return new Response(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="tan-suat-quan-trac_${from}_${to}.csv"` } });
}
