import { signedIn } from "@/lib/platform/data/access";
import { calibrationLogStore } from "@/lib/modules/m2/data/calibration-logs";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { filterCalibrations } from "@/lib/modules/m2/manage";
import { fmtDateVN } from "@/lib/platform/dates";
import { csvResponse } from "@/lib/platform/format";

export const dynamic = "force-dynamic";

/** Xuất lịch sử hiệu chuẩn (CSV) theo bộ lọc của trang Lịch sử hiệu chuẩn. */
export async function GET(req: Request) {
  const denied = await signedIn();
  if (denied) return denied;
  const p = new URL(req.url).searchParams;
  const f = Object.fromEntries(["eq", "mode", "ifrom", "ito", "pfrom", "pto"].map((k) => [k, p.get(k) ?? ""]));
  const [logs, equipment] = await Promise.all([calibrationLogStore.list(), equipmentStore.list()]);
  const eq = new Map(equipment.map((e) => [e.id, e]));
  const rows = filterCalibrations(logs, f).map((l) => {
    const e = eq.get(l.equipmentId ?? "");
    return [e?.code ?? l.equipmentCode, e?.name ?? l.equipmentName, fmtDateVN(l.internalDate), l.internalBy ?? "", fmtDateVN(l.date), l.place, l.certificate, l.condition ?? "", l.note ?? ""];
  });
  return csvResponse("lich-su-hieu-chuan", "Lịch sử hiệu chuẩn", ["Mã thiết bị", "Tên thiết bị", "Ngày hiệu chuẩn nội bộ", "Người thực hiện", "Ngày hiệu chuẩn định kỳ", "Đơn vị thực hiện", "Số giấy chứng nhận", "Tình trạng", "Ghi chú"], rows);
}
