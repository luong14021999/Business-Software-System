import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { LAB_REPORTS, runReport, type LabReport } from "@/lib/modules/m2/data/lab-stats";
import { csvRow } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Xuất sổ / thống kê ra CSV (BOM UTF-8 để Excel đọc đúng tiếng Việt); nhiều bảng cách nhau bằng dòng trống. */
export async function GET(req: Request, { params }: { params: Promise<{ report: string }> }) {
  const { report } = await params;
  const gate = await authorize(report === "cong-no" ? "view.finance" : "view.stats");
  if (!gate.ok) return gate.response;
  if (!(report in LAB_REPORTS)) return NextResponse.json({ error: "Không có báo cáo này" }, { status: 404 });
  const u = new URL(req.url);
  const from = u.searchParams.get("from") ?? "";
  const to = u.searchParams.get("to") ?? "";
  const basis = u.searchParams.get("basis") === "tra-ket-qua" ? "tra-ket-qua" : "quan-trac";
  const tables = await runReport(report as LabReport, from, to, { list: u.searchParams.get("list") ?? undefined, basis, giam: Math.min(100, Math.max(0, Number(u.searchParams.get("giam")) || 0)) });
  const lines = [csvRow([`${LAB_REPORTS[report as LabReport].title} – từ ${from || "…"} đến ${to || "…"}`])];
  for (const t of tables) {
    lines.push("");
    if (t.title) lines.push(csvRow([t.title]));
    lines.push(csvRow(["TT", ...t.columns]));
    t.rows.forEach((r, i) => lines.push(csvRow([i + 1, ...r])));
    if (t.total) lines.push(csvRow(["", ...t.total]));
  }
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${report}_${from}_${to}.csv"` },
  });
}
