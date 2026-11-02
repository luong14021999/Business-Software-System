import { describe, expect, it } from "vitest";
import { money, readRateRows } from "./rate-io";

describe("bảng giá", () => {
  it("đọc số tiền có dấu chấm ngăn nghìn", () => {
    expect(money("1.250.000")).toBe(1250000);
    expect(money("350 000 đ")).toBe(350000);
    expect(money("")).toBeNull();
  });

  it("đọc file theo tên cột, báo dòng sai", () => {
    const { rows, errors } = readRateRows([
      ["Loại mẫu", "Chỉ tiêu", "Đơn giá", "Giá vốn"],
      ["Đất", "pH", "50.000", ""],
      ["Đất", "N tổng", "abc", ""],
    ]);
    expect(rows).toEqual([{ type: "Đất", analyte: "pH", amount: 50000, cost: null }]);
    expect(errors[0]).toContain("N tổng");
  });
});
