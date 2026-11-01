import { NextResponse } from "next/server";
import { tissueReport } from "@/lib/modules/m3/data/tissue-report";
import { csvRow } from "@/lib/platform/format";
import { currentActor } from "@/lib/platform/auth/server";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** Báo cáo cây giống nuôi cấy mô năm dạng CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt). */
export async function GET(req: Request) {
  if (!(await currentActor())) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const thisYear = Number(todayISO().slice(0, 4));
  const year = Math.min(thisYear + 1, Math.max(2020, Number(new URL(req.url).searchParams.get("year")) || thisYear));
  const r = await tissueReport(year);
  const lines = [
    csvRow([`Báo cáo sản xuất – kinh doanh cây giống nuôi cấy mô năm ${year} – Viện Nông nghiệp tỉnh Thanh Hóa`]),
    "",
    csvRow(["Chỉ tiêu", "Giá trị"]),
    csvRow(["Cây ra ngôi", r.totals.plants]),
    csvRow(["Cây sống", r.totals.survived]),
    csvRow(["Cây đã bán", r.totals.sold]),
    csvRow(["Doanh thu (VND)", r.totals.revenue]),
    csvRow(["Giá thành phần đã bán, tính được (VND)", r.totals.cost]),
    csvRow(["Đơn hàng có ngày giao trong năm", r.totals.dueOrders]),
    csvRow(["Đơn giao đúng hạn", r.totals.onTime]),
    csvRow(["Phản hồi khách hàng", r.totals.feedback]),
    csvRow(["Hài lòng trung bình (1–5)", r.totals.avgRating == null ? "" : r.totals.avgRating.toFixed(2)]),
    "",
    csvRow(["Tháng", "Cây ra ngôi", "Cây đã bán", "Doanh thu (VND)"]),
    ...r.months.map((m, i) => csvRow([m, r.plantsByMonth[i], r.soldByMonth[i], r.revenueByMonth[i]])),
    "",
    csvRow(["Giống", "Ra ngôi", "Sống", "Đã bán", "Doanh thu (VND)"]),
    ...r.bySpecies.map((s) => csvRow([s.species, s.plants, s.survived, s.sold, s.revenue])),
    "",
    csvRow(["Lô", "Giống", "Ra ngôi", "Sống", "Đã bán", "Doanh thu (VND)", "Giá thành / cây (VND)", "Tỷ suất lợi nhuận (%)"]),
    ...r.byLot.map((l) => csvRow([l.code, l.species, l.quantity, l.survived, l.sold, l.revenue, l.perPlant ?? "", l.margin ?? ""])),
  ];
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="cay-giong-nuoi-cay-mo-${year}.csv"` },
  });
}
