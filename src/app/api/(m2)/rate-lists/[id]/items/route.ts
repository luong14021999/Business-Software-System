import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { rateItemStore, rateListStore, saveRateRows } from "@/lib/modules/m2/data/settings";
import { sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { RATE_COLUMNS, money, readRateRows } from "@/lib/modules/m2/rate-io";
import { parseCsv } from "@/lib/modules/m2/orders";
import { csvRow, normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const listOf = async (id: string) => (await rateListStore.list()).find((l) => l.id === id);

/** Xuất bảng giá / định mức (CSV; `type` = chỉ một loại mẫu). */
export async function GET(req: Request, { params }: Ctx) {
  const gate = await authorize("view.finance");
  if (!gate.ok) return gate.response;
  const list = await listOf((await params).id);
  if (!list) return NextResponse.json({ error: "Không tìm thấy bảng" }, { status: 404 });
  const type = new URL(req.url).searchParams.get("type") ?? "";
  const [items, types] = await Promise.all([rateItemStore.list(), sampleTypeStore.list()]);
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const rows = items
    .filter((i) => i.listId === list.id && (!type || i.sampleTypeId === type))
    .sort((a, b) => (typeName.get(a.sampleTypeId) ?? "").localeCompare(typeName.get(b.sampleTypeId) ?? "", "vi") || a.analyte.localeCompare(b.analyte, "vi"))
    .map((i) => csvRow([typeName.get(i.sampleTypeId) ?? "", i.analyte, i.amount, i.cost ?? ""]));
  return new Response(`﻿${[csvRow([...RATE_COLUMNS]), ...rows].join("\r\n")}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(list.name)}.csv` },
  });
}

/** Lưu lưới giá của một loại mẫu: { sampleTypeId, rows: [{ analyte, amount, cost }] }. */
export async function PUT(req: Request, { params }: Ctx) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const list = await listOf((await params).id);
  if (!list) return NextResponse.json({ error: "Không tìm thấy bảng" }, { status: 404 });
  const { sampleTypeId = "", rows = [] } = (await req.json()) as { sampleTypeId?: string; rows?: { analyte?: string; amount?: string | number | null; cost?: string | number | null }[] };
  if (!(await sampleTypeStore.list()).some((t) => t.id === sampleTypeId)) return NextResponse.json({ error: "Chọn loại mẫu" }, { status: 400 });
  const clean = rows.map((r) => ({ analyte: String(r.analyte ?? ""), amount: money(String(r.amount ?? "")), cost: money(String(r.cost ?? "")) }));
  const bad = clean.find((r) => Number.isNaN(r.amount) || Number.isNaN(r.cost));
  if (bad) return NextResponse.json({ error: `${bad.analyte}: đơn giá / giá vốn không phải số` }, { status: 400 });
  const n = await saveRateRows(list.id, sampleTypeId, clean);
  await logChange({ entity: "rate-lists", entityId: list.id, action: "Sửa", label: list.name, changes: [{ field: "đơn giá", old: "", new: `${n} chỉ tiêu` }] });
  return NextResponse.json({ ok: true, saved: n });
}

/** Nhập bảng giá từ file CSV (cột Loại mẫu, Chỉ tiêu, Đơn giá, Giá vốn). */
export async function POST(req: Request, { params }: Ctx) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const list = await listOf((await params).id);
  if (!list) return NextResponse.json({ error: "Không tìm thấy bảng" }, { status: 404 });
  const file = (await req.formData()).get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Chưa chọn file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File tối đa 5 MB" }, { status: 400 });
  const { rows, errors } = readRateRows(parseCsv(await file.text()));
  if (!rows.length) return NextResponse.json({ error: errors[0] ?? "File không có dòng nào" }, { status: 400 });
  const typeId = new Map((await sampleTypeStore.list()).map((t) => [normalizeVi(t.name), t.id]));
  const byType = new Map<string, typeof rows>();
  for (const r of rows) {
    const t = typeId.get(normalizeVi(r.type));
    if (!t) {
      errors.push(`"${r.analyte}": không có loại mẫu "${r.type}"`);
      continue;
    }
    byType.set(t, [...(byType.get(t) ?? []), r]);
  }
  let n = 0;
  for (const [t, rs] of byType) n += await saveRateRows(list.id, t, rs);
  await logChange({ entity: "rate-lists", entityId: list.id, action: "Nhập file", label: list.name, changes: [{ field: "đơn giá", old: "", new: `${n} chỉ tiêu từ ${file.name}` }] });
  return NextResponse.json({ ok: true, saved: n, errors });
}
