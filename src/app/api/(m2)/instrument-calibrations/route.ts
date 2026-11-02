import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { calibrationLogStore } from "@/lib/modules/m2/data/calibration-logs";
import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { EQUIPMENT_CONDITIONS } from "@/lib/modules/m2/data/manage";
import { nextCalibrationDue } from "@/lib/modules/m2/manage";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Ghi một lần hiệu chuẩn (nội bộ và / hoặc định kỳ) và cập nhật ngày hiệu chuẩn, hạn tiếp theo, tình trạng của thiết bị. */
export async function POST(req: Request) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Record<string, string>;
  const e = (await equipmentStore.list()).find((x) => x.id === b.equipmentId);
  if (!e) return NextResponse.json({ error: "Không tìm thấy thiết bị" }, { status: 404 });
  const internalDate = String(b.internalDate ?? "").trim();
  const date = String(b.date ?? "").trim();
  if (!internalDate && !date) return NextResponse.json({ error: "Nhập ngày hiệu chuẩn nội bộ hoặc định kỳ" }, { status: 400 });
  if ((internalDate && !ISO.test(internalDate)) || (date && !ISO.test(date))) return NextResponse.json({ error: "Ngày không hợp lệ" }, { status: 400 });
  const condition = (EQUIPMENT_CONDITIONS as readonly string[]).includes(b.condition) ? b.condition : e.condition || "Không rõ";
  const nextDate = date ? nextCalibrationDue(date, e.calibrationDays) : "";
  const item = await calibrationLogStore.create({
    id: "",
    equipmentId: e.id,
    equipmentCode: e.code,
    equipmentName: e.name,
    date,
    internalDate,
    internalBy: String(b.internalBy ?? "").trim(),
    place: String(b.place ?? "").trim(),
    certificate: String(b.certificate ?? "").trim(),
    condition,
    note: String(b.note ?? "").trim(),
    result: condition === "Hỏng" || condition === "Kém" ? "Không đạt" : "Đạt",
    nextDate,
    technician: String(b.internalBy ?? "").trim(),
  });
  await equipmentStore.update(e.id, { condition, ...(date ? { lastCalibration: date, nextCalibration: nextDate || e.nextCalibration, calibrationPlace: item.place || e.calibrationPlace } : {}) });
  await logChange({ entity: "instrument-calibrations", entityId: item.id, action: "Thêm", label: `${e.code} – ${[internalDate && `nội bộ ${internalDate}`, date && `định kỳ ${date}`].filter(Boolean).join(", ")}` });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
