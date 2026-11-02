import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { linesBySampleCodes } from "@/lib/modules/m2/data/orders";
import { saveLineEdits, type LineEdit } from "@/lib/modules/m2/data/line-entry";
import { fieldOnlyEntry, matrixCells, parseCsv } from "@/lib/modules/m2/orders";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/**
 * Nhập kết quả từ file CSV dạng ma trận (như file "Xuất Excel"): khớp mã mẫu + tên chỉ tiêu,
 * chỉ ghi dòng đang nhập / bị trả lại. Ô trống không xóa kết quả đã có.
 */
export async function POST(req: Request) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Chọn file CSV kết quả" }, { status: 400 });
  if (file.size > 5_000_000) return NextResponse.json({ error: "File quá lớn (tối đa 5 MB)" }, { status: 400 });
  if (!/\.csv$/i.test(file.name)) return NextResponse.json({ error: "Chỉ nhận file .csv – trong Excel chọn Lưu thành (Save As) → CSV UTF-8" }, { status: 400 });
  const { error, cells } = matrixCells(parseCsv(await file.text()));
  if (error) return NextResponse.json({ error }, { status: 400 });
  const codes = [...new Set(cells.map((c) => c.code))];
  let lines = await linesBySampleCodes(codes);
  if (fieldOnlyEntry(gate.roles)) lines = lines.filter((l) => l.lineKind === "Hiện trường");
  const edits: LineEdit[] = [];
  const missing: string[] = [];
  for (const c of cells) {
    const l = lines.find((x) => x.sampleCode === c.code && normalizeVi(x.criterion) === normalizeVi(c.criterion));
    if (l) edits.push({ id: l.id, text: c.text });
    else missing.push(`${c.code} · ${c.criterion}`);
  }
  const { saved, errors } = await saveLineEdits(edits, lines, gate.actor.name, "từ file Excel");
  return NextResponse.json({ ok: !errors.length, saved, cells: cells.length, errors, missing: missing.slice(0, 50) }, { status: errors.length ? 400 : 200 });
}
