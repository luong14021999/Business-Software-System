import { signedIn } from "@/lib/platform/data/access";
import { analyteStore, sampleTypeStore } from "@/lib/modules/m2/data/orders";
import { ANALYTE_COLUMNS } from "@/lib/modules/m2/analyte-io";
import { csvRow } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Xuất danh sách chỉ tiêu (CSV, cột như file nhập); `mau=1` chỉ xuất dòng tiêu đề làm file mẫu. */
export async function GET(req: Request) {
  const denied = await signedIn();
  if (denied) return denied;
  const p = new URL(req.url).searchParams;
  const type = p.get("type") ?? "";
  const [items, types] = await Promise.all([analyteStore.list(), sampleTypeStore.list()]);
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const rows = p.get("mau")
    ? []
    : items
        .filter((a) => !type || a.sampleTypeId === type)
        .sort((a, b) => (typeName.get(a.sampleTypeId) ?? "").localeCompare(typeName.get(b.sampleTypeId) ?? "", "vi") || a.sort - b.sort || a.name.localeCompare(b.name, "vi"))
        .map((a) => [typeName.get(a.sampleTypeId) ?? "", a.name, a.englishName, a.printName, a.abbreviation, a.unit, a.groupName, a.method, a.samplingMethod, a.sort || "", a.isField ? "x" : "", a.scope, a.loq, a.unitPrice || "", a.note]);
  const csv = [csvRow([...ANALYTE_COLUMNS]), ...rows.map(csvRow)].join("\r\n");
  const name = p.get("mau") ? "mau-nhap-chi-tieu" : `chi-tieu${type ? `_${typeName.get(type) ?? ""}` : ""}`;
  return new Response(`﻿${csv}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}.csv` },
  });
}
