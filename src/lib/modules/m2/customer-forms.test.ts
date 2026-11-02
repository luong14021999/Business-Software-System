import { describe, expect, it } from "vitest";
import { contractStatus, nextCustomerCode, scheduleDates } from "./customer-forms";

describe("khách hàng (giao diện XaLab)", () => {
  it("mã khách hàng tự sinh theo năm", () => {
    expect(nextCustomerCode(2026, ["KH-2026-0007", "KH-2025-0099", "KH-VNNTH-0124"])).toBe("KH-2026-0008");
    expect(nextCustomerCode(2027, [])).toBe("KH-2027-0001");
  });
  it("trạng thái hợp đồng", () => {
    expect(contractStatus("", "2026-11-02")).toBe("Đang thực hiện");
    expect(contractStatus("2026-10-01", "2026-11-02")).toBe("Đã thanh lý");
    expect(contractStatus("2026-12-01", "2026-11-02")).toBe("Đang thực hiện");
  });
  it("ngày quan trắc định kỳ trong khoảng, bỏ ngày không tồn tại", () => {
    const s = [{ fieldDay: 15, fieldMonth: 3 }, { fieldDay: 31, fieldMonth: 4 }, { fieldDay: 1, fieldMonth: 12 }, { fieldDay: null, fieldMonth: 5 }];
    expect(scheduleDates(s, "2026-01-01", "2027-03-31")).toEqual(["2026-03-15", "2026-12-01", "2027-03-15"]);
    expect(scheduleDates(s, "2026-03-16", "2026-11-30")).toEqual([]);
  });
});
