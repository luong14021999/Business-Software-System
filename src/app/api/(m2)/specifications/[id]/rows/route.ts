import { NextResponse } from "next/server";
import { authorize, signedIn } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { saveSpecRows } from "@/lib/modules/m2/data/settings";
import { specById, specRows } from "@/lib/modules/m2/data/specs";
import { SPEC_ROW_COLUMNS, cellNumber, readSpecRows, type SpecRow } from "@/lib/modules/m2/spec-rows";
import { parseCsv, specLabel } from "@/lib/modules/m2/orders";
import { csvRow } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Xuất lưới chỉ tiêu của cột quy chuẩn (CSV, dùng luôn làm file mẫu để nhập). */
export async function GET(_req: Request, { params }: Ctx) {
  const denied = await signedIn();
  if (denied) return denied;
  const spec = await specById((await params).id);
  if (!spec) return NextResponse.json({ error: "Không tìm thấy cột quy chuẩn" }, { status: 404 });
  const n = (v: number | null) => (v == null ? "" : String(v).replace(".", ","));
  const lines = [csvRow([...SPEC_ROW_COLUMNS]), ...(await specRows(spec)).map((r) => csvRow([r.analyte, r.unit, n(r.minValue), n(r.maxValue), r.notDetected ? "x" : "", r.ndText, r.printNote, r.printText]))];
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`quy-chuan_${specLabel(spec)}`)}.csv` },
  });
}

/** Lưu cả lưới (nút Lưu): dòng có giới hạn thì ghi, dòng trống thì xóa. */
export async function PUT(req: Request, { params }: Ctx) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const spec = await specById((await params).id);
  if (!spec) return NextResponse.json({ error: "Không tìm thấy cột quy chuẩn" }, { status: 404 });
  const { rows = [] } = (await req.json()) as { rows?: Partial<Record<keyof SpecRow, unknown>>[] };
  const clean: SpecRow[] = [];
  for (const r of rows) {
    const minValue = r.minValue == null || r.minValue === "" ? null : cellNumber(String(r.minValue));
    const maxValue = r.maxValue == null || r.maxValue === "" ? null : cellNumber(String(r.maxValue));
    if (Number.isNaN(minValue) || Number.isNaN(maxValue)) return NextResponse.json({ error: `${r.analyte}: giá trị tối thiểu / tối đa không phải số` }, { status: 400 });
    clean.push({ analyte: String(r.analyte ?? ""), unit: "", minValue, maxValue, notDetected: Boolean(r.notDetected), ndText: String(r.ndText ?? ""), printNote: String(r.printNote ?? ""), printText: String(r.printText ?? "") });
  }
  const n = await saveSpecRows(spec.id, clean);
  await logChange({ entity: "specifications", entityId: spec.id, action: "Sửa", label: specLabel(spec), changes: [{ field: "giới hạn chỉ tiêu", old: "", new: `${n} chỉ tiêu` }] });
  return NextResponse.json({ ok: true, saved: n });
}

/** Nhập lưới từ file CSV (cột như file Xuất Excel). */
export async function POST(req: Request, { params }: Ctx) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const spec = await specById((await params).id);
  if (!spec) return NextResponse.json({ error: "Không tìm thấy cột quy chuẩn" }, { status: 404 });
  const file = (await req.formData()).get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Chưa chọn file" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "File tối đa 2 MB" }, { status: 400 });
  const { rows, errors } = readSpecRows(parseCsv(await file.text()));
  if (!rows.length) return NextResponse.json({ error: errors[0] ?? "File không có dòng nào" }, { status: 400 });
  const n = await saveSpecRows(spec.id, rows);
  await logChange({ entity: "specifications", entityId: spec.id, action: "Nhập file", label: specLabel(spec), changes: [{ field: "giới hạn chỉ tiêu", old: "", new: `${n} chỉ tiêu từ ${file.name}` }] });
  return NextResponse.json({ ok: true, saved: n, errors });
}
