import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { testRecordAnalyteStore, testRecordStore } from "@/lib/modules/m2/data/catalogs";

export const dynamic = "force-dynamic";

/** Thêm một hoặc nhiều chỉ tiêu vào biên bản thử nghiệm (bỏ qua chỉ tiêu đã có). */
export async function POST(req: Request) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const { recordId, analyteIds = [] } = (await req.json()) as { recordId?: string; analyteIds?: string[] };
  const record = (await testRecordStore.list()).find((r) => r.id === recordId);
  if (!record) return NextResponse.json({ error: "Không tìm thấy biên bản" }, { status: 404 });
  const have = (await testRecordAnalyteStore.list()).filter((x) => x.recordId === record.id);
  const fresh = [...new Set(analyteIds)].filter((id) => id && !have.some((h) => h.analyteId === id));
  if (!fresh.length) return NextResponse.json({ error: "Chỉ tiêu đã có trong biên bản hoặc chưa chọn" }, { status: 400 });
  let sort = have.reduce((m, h) => Math.max(m, h.sort), 0);
  for (const analyteId of fresh) await testRecordAnalyteStore.create({ id: "", recordId: record.id, analyteId, sort: ++sort });
  await logChange({ entity: "test-records", entityId: record.id, action: "Thêm chỉ tiêu", label: record.name, changes: [{ field: "chỉ tiêu", old: "", new: `${fresh.length} chỉ tiêu` }] });
  return NextResponse.json({ ok: true, added: fresh.length }, { status: 201 });
}
