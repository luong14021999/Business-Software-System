import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { analyteStore, sampleTypeStore, type LabAnalyte } from "@/lib/modules/m2/data/orders";
import { analyteMethodStore } from "@/lib/modules/m2/data/settings";
import { readAnalyteRows } from "@/lib/modules/m2/analyte-io";
import { parseCsv } from "@/lib/modules/m2/orders";
import { normalizeVi } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Nhập chỉ tiêu từ file CSV: trùng loại mẫu + tên thì cập nhật (chỉ các ô có giá trị), chưa có thì thêm mới. */
export async function POST(req: Request) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const file = (await req.formData()).get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Chưa chọn file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File tối đa 5 MB" }, { status: 400 });
  const { rows, errors } = readAnalyteRows(parseCsv(await file.text()));
  if (!rows.length) return NextResponse.json({ error: errors[0] ?? "File không có dòng chỉ tiêu nào" }, { status: 400 });
  const [types, existing] = await Promise.all([sampleTypeStore.list(), analyteStore.list()]);
  const typeId = new Map(types.map((t) => [normalizeVi(t.name), t.id]));
  const key = (t: string, n: string) => `${t}|${normalizeVi(n)}`;
  const have = new Map(existing.map((a) => [key(a.sampleTypeId, a.name), a]));
  let added = 0;
  let updated = 0;
  for (const r of rows) {
    const tid = typeId.get(normalizeVi(r.type));
    if (!tid) {
      errors.push(`"${r.name}": không có loại mẫu "${r.type}"`);
      continue;
    }
    const patch: Partial<LabAnalyte> = Object.fromEntries(
      Object.entries({ englishName: r.englishName, printName: r.printName, abbreviation: r.abbreviation, unit: r.unit, groupName: r.groupName, method: r.method, samplingMethod: r.samplingMethod, sort: r.sort || undefined, scope: r.scope, loq: r.loq, unitPrice: r.unitPrice || undefined, note: r.note, isField: r.isField || undefined }).filter(([, v]) => v !== "" && v !== undefined),
    );
    const cur = have.get(key(tid, r.name));
    if (cur) {
      await analyteStore.update(cur.id, patch);
      updated++;
    } else {
      const item = await analyteStore.create({
        id: "", sampleTypeId: tid, name: r.name, groupName: "", unit: "", method: "", loq: "", scope: "VILAS", accreditedNo: null, sort: 0, active: true, unitPrice: 0,
        printName: "", abbreviation: "", isField: false, note: "", formulaCode: "", industry: "", spec1Id: "", spec2Id: "", decimals: null,
        englishName: "", samplingMethod: "", noKFactor: false, notInQuote: false, allocatedCost: false, ...patch,
      });
      if (item.method) await analyteMethodStore.create({ id: "", analyteId: item.id, method: item.method, isDefault: true, minValue: null, maxValue: null, subcontractor: "" });
      have.set(key(tid, r.name), item);
      added++;
    }
  }
  await logChange({ entity: "lab-analytes", entityId: "import", action: "Nhập file", label: file.name, changes: [{ field: "chỉ tiêu", old: "", new: `thêm ${added}, cập nhật ${updated}` }] });
  return NextResponse.json({ ok: true, added, updated, errors });
}
