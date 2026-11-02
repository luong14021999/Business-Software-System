import { signedIn } from "@/lib/platform/data/access";
import { instrumentRows } from "@/lib/modules/m2/data/manage";
import { dueMonths } from "@/lib/modules/m2/manage";
import { fmtDateVN } from "@/lib/platform/dates";
import { csvResponse } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Kế hoạch kiểm định (CSV): thiết bị đến hạn hiệu chuẩn trong năm, đánh dấu "x" ở các tháng đến hạn. */
export async function GET(req: Request) {
  const denied = await signedIn();
  if (denied) return denied;
  const p = new URL(req.url).searchParams;
  const year = /^\d{4}$/.test(p.get("year") ?? "") ? Number(p.get("year")) : new Date().getFullYear() + 1;
  const system = p.get("system") ?? "";
  const rows = (await instrumentRows())
    .filter((e) => e.active !== false && (!system || e.managementSystem === system))
    .map((e) => ({ e, months: dueMonths(year, e.periodicDate, e.calibrationDays, e.due) }))
    .filter((x) => x.months.length)
    .map(({ e, months }) => [e.code, e.name, e.typeName, e.serial ?? "", e.calibrationDays ?? "", fmtDateVN(e.periodicDate), e.calibrationUnit, ...Array.from({ length: 12 }, (_, i) => (months.includes(i + 1) ? "x" : ""))]);
  return csvResponse(`ke-hoach-kiem-dinh_${year}`, `Kế hoạch kiểm định / hiệu chuẩn thiết bị năm ${year}${system ? ` – ${system}` : ""}`, ["Mã thiết bị", "Tên thiết bị", "Loại thiết bị", "Số seri", "Tần suất (ngày/lần)", "Hiệu chuẩn định kỳ gần nhất", "Đơn vị hiệu chuẩn", ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`)], rows);
}
