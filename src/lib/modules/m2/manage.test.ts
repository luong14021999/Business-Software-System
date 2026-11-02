import { describe, expect, it } from "vitest";
import { calibrationState, dueMonths, filterCalibrations, lotAlerts, lotState, nextCalibrationDue } from "./manage";

describe("hiệu chuẩn thiết bị", () => {
  it("hạn tiếp theo = lần định kỳ gần nhất + tần suất, thiếu thì dùng hạn ghi sẵn", () => {
    expect(nextCalibrationDue("2026-01-10", 365)).toBe("2027-01-10");
    expect(nextCalibrationDue("", 365, "2026-05-01")).toBe("2026-05-01");
    expect(nextCalibrationDue("2026-01-10", null, "")).toBe("");
  });

  it("phân loại quá hạn / hôm nay / sắp đến hạn", () => {
    expect(calibrationState("2026-10-31", "2026-11-02")).toBe("qua-han");
    expect(calibrationState("2026-11-02", "2026-11-02")).toBe("hom-nay");
    expect(calibrationState("2026-11-20", "2026-11-02")).toBe("sap");
    expect(calibrationState("2027-03-01", "2026-11-02")).toBe("");
    expect(calibrationState("", "2026-11-02")).toBe("");
  });

  it("các tháng đến hạn trong năm theo tần suất", () => {
    expect(dueMonths(2027, "2026-07-15", 180)).toEqual([1, 7]);
    expect(dueMonths(2027, "2026-03-01", 365)).toEqual([3]);
    expect(dueMonths(2027, "", null, "2027-09-09")).toEqual([9]);
    expect(dueMonths(2027, "", null, "2026-09-09")).toEqual([]);
  });
});

describe("tồn kho hóa chất", () => {
  const today = "2026-11-02";
  it("tình trạng lô", () => {
    expect(lotState({ remaining: 5, disposed: false, expiry: "2027-01-01" }, today)).toBe("Còn hàng");
    expect(lotState({ remaining: 0, disposed: false, expiry: "" }, today)).toBe("Hết hàng");
    expect(lotState({ remaining: 5, disposed: true, expiry: "" }, today)).toBe("Đã tiêu hủy");
    expect(lotState({ remaining: 5, disposed: false, expiry: "2026-10-01" }, today)).toBe("Quá hạn");
  });

  it("cảnh báo quá hạn, sắp hết hạn, sắp hết", () => {
    expect(lotAlerts({ remaining: 5, disposed: false, expiry: "2026-10-01", qtyIn: 10 }, today)).toEqual({ expired: true, expiring: false, low: false });
    expect(lotAlerts({ remaining: 5, disposed: false, expiry: "2026-11-20", qtyIn: 10 }, today)).toEqual({ expired: false, expiring: true, low: false });
    expect(lotAlerts({ remaining: 1, disposed: false, expiry: "", qtyIn: 10 }, today)).toEqual({ expired: false, expiring: false, low: true });
    expect(lotAlerts({ remaining: 1, disposed: true, expiry: "2026-10-01", qtyIn: 10 }, today)).toEqual({ expired: false, expiring: false, low: false });
  });
});

describe("lọc lịch sử hiệu chuẩn", () => {
  const logs = [
    { id: "1", equipmentId: "a", internalDate: "2026-03-01", date: "" },
    { id: "2", equipmentId: "a", internalDate: "", date: "2026-06-01" },
    { id: "3", equipmentId: "b", internalDate: "2026-03-05", date: "2026-03-05" },
    { id: "4", equipmentId: "", internalDate: "2026-03-05", date: "2026-03-05" },
  ];
  it("theo thiết bị và loại hiệu chuẩn", () => {
    expect(filterCalibrations(logs, { eq: "a" }).map((l) => l.id)).toEqual(["2", "1"]);
    expect(filterCalibrations(logs, { mode: "noi-bo", ifrom: "2026-03-02" }).map((l) => l.id)).toEqual(["3"]);
    expect(filterCalibrations(logs, { mode: "dinh-ky", pto: "2026-05-31" }).map((l) => l.id)).toEqual(["3"]);
  });
});
