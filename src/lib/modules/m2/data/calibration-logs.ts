import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { calibrationLogs, type CalibrationLog } from "@/lib/mock-data";

export const calibrationLogStore = createEntityStore<CalibrationLog>(
  "calibration-logs",
  calibrationLogs,
  {
    table: "calibration_logs",
    select:
      "id, equipment_code, equipment_name, date, result, certificate, place, next_date, technician, note, equipment_id, internal_date, internal_by, condition",
    toEntity: (r) => ({
      id: r.id as string,
      equipmentCode: (r.equipment_code as string) ?? "",
      equipmentName: (r.equipment_name as string) ?? "",
      date: (r.date as string) ?? "",
      result: (r.result as CalibrationLog["result"]) ?? "Đạt",
      certificate: (r.certificate as string) ?? "",
      place: (r.place as string) ?? "",
      nextDate: (r.next_date as string) ?? "",
      technician: (r.technician as string) ?? "",
      note: (r.note as string) ?? "",
      equipmentId: (r.equipment_id as string) ?? "",
      internalDate: (r.internal_date as string) ?? "",
      internalBy: (r.internal_by as string) ?? "",
      condition: (r.condition as string) ?? "",
    }),
    toRow: (e) => {
      const r: Record<string, unknown> = {};
      if (e.equipmentCode !== undefined) r.equipment_code = e.equipmentCode;
      if (e.equipmentName !== undefined) r.equipment_name = e.equipmentName;
      if (e.date !== undefined) r.date = dateOrNull(e.date);
      if (e.result !== undefined) r.result = e.result;
      if (e.certificate !== undefined) r.certificate = e.certificate;
      if (e.place !== undefined) r.place = e.place;
      if (e.nextDate !== undefined) r.next_date = dateOrNull(e.nextDate);
      if (e.technician !== undefined) r.technician = e.technician;
      if (e.note !== undefined) r.note = e.note;
      if (e.equipmentId !== undefined) r.equipment_id = e.equipmentId || null;
      if (e.internalDate !== undefined) r.internal_date = dateOrNull(e.internalDate);
      if (e.internalBy !== undefined) r.internal_by = e.internalBy;
      if (e.condition !== undefined) r.condition = e.condition;
      return r;
    },
  },
);
