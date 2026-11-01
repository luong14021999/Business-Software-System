import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { equipments, type Equipment } from "@/lib/mock-data";

const SELECT =
  "id, code, name, model, location, last_calibration, next_calibration, status, usage_hours, serial, manufacturer, commissioned_at, calibration_freq, calibration_place, inspection_freq, inspection_place, purpose, quantity, equipment_type, is_field";

export const equipmentStore = createEntityStore<Equipment>(
  "equipment",
  equipments,
  {
    table: "equipment",
    select: SELECT,
    toEntity: (row) => ({
      id: row.id as string,
      code: (row.code as string) ?? "",
      name: (row.name as string) ?? "",
      model: (row.model as string) ?? "",
      location: (row.location as string) ?? "",
      lastCalibration: (row.last_calibration as string) ?? "",
      nextCalibration: (row.next_calibration as string) ?? "",
      status: (row.status as Equipment["status"]) ?? "Hoạt động",
      usageHours: (row.usage_hours as number) ?? 0,
      serial: (row.serial as string) ?? "",
      manufacturer: (row.manufacturer as string) ?? "",
      commissionedAt: (row.commissioned_at as string) ?? "",
      calibrationFreq: (row.calibration_freq as string) ?? "",
      calibrationPlace: (row.calibration_place as string) ?? "",
      inspectionFreq: (row.inspection_freq as string) ?? "",
      inspectionPlace: (row.inspection_place as string) ?? "",
      purpose: (row.purpose as string) ?? "",
      quantity: (row.quantity as string) ?? "",
      equipmentType: (row.equipment_type as string) ?? "",
      isField: Boolean(row.is_field),
    }),
    toRow: (e) => {
      const r: Record<string, unknown> = {};
      if (e.code !== undefined) r.code = e.code;
      if (e.name !== undefined) r.name = e.name;
      if (e.model !== undefined) r.model = e.model;
      if (e.location !== undefined) r.location = e.location;
      if (e.lastCalibration !== undefined)
        r.last_calibration = dateOrNull(e.lastCalibration);
      if (e.nextCalibration !== undefined)
        r.next_calibration = dateOrNull(e.nextCalibration);
      if (e.status !== undefined) r.status = e.status;
      if (e.usageHours !== undefined) r.usage_hours = e.usageHours;
      if (e.serial !== undefined) r.serial = e.serial;
      if (e.manufacturer !== undefined) r.manufacturer = e.manufacturer;
      if (e.commissionedAt !== undefined)
        r.commissioned_at = dateOrNull(e.commissionedAt);
      if (e.calibrationFreq !== undefined)
        r.calibration_freq = e.calibrationFreq;
      if (e.calibrationPlace !== undefined)
        r.calibration_place = e.calibrationPlace;
      if (e.inspectionFreq !== undefined)
        r.inspection_freq = e.inspectionFreq;
      if (e.inspectionPlace !== undefined)
        r.inspection_place = e.inspectionPlace;
      if (e.purpose !== undefined) r.purpose = e.purpose;
      if (e.quantity !== undefined) r.quantity = e.quantity;
      if (e.equipmentType !== undefined) r.equipment_type = e.equipmentType;
      if (e.isField !== undefined) r.is_field = e.isField;
      return r;
    },
  },
);
