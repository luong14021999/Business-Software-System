import { describe, expect, it } from "vitest";
import { formatReportNo, nextReportStart } from "./report-numbers";

describe("số phiếu kết quả", () => {
  it("cấp tiếp sau số lớn nhất đã cấp", () => {
    expect(nextReportStart([])).toBe(1);
    expect(nextReportStart([{ startNo: 1, quantity: 2 }, { startNo: 3, quantity: 1 }])).toBe(4);
  });
  it("định dạng số / khoảng số kèm năm", () => {
    expect(formatReportNo(12, 1, 2026)).toBe("12/2026");
    expect(formatReportNo(12, 3, 2026)).toBe("12-14/2026");
  });
});
