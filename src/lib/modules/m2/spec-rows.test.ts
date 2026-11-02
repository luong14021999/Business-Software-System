import { describe, expect, it } from "vitest";
import { cellNumber, emptyRow, readSpecRows } from "./spec-rows";

describe("lưới chỉ tiêu của cột quy chuẩn", () => {
  it("đọc số kiểu Việt Nam, ô trống là null", () => {
    expect(cellNumber("1,5")).toBe(1.5);
    expect(cellNumber(" ")).toBeNull();
    expect(cellNumber("abc")).toBeNaN();
  });

  it("đọc file nhập theo tên cột, báo dòng sai số", () => {
    const { rows, errors } = readSpecRows([
      ["Chỉ tiêu phân tích", "Đơn vị", "Giá trị tối thiểu", "Giá trị tối đa", "Không phát hiện", "Giá trị khi in"],
      ["pH", "-", "5,5", "9", "", ""],
      ["Coliform", "MPN/100mL", "", "", "x", "KPH"],
      ["COD", "mg/L", "", "nhiều", "", ""],
    ]);
    expect(rows).toEqual([
      expect.objectContaining({ analyte: "pH", minValue: 5.5, maxValue: 9, notDetected: false }),
      expect.objectContaining({ analyte: "Coliform", minValue: null, notDetected: true, printText: "KPH" }),
    ]);
    expect(errors).toEqual(["Dòng 4 (COD): giá trị tối thiểu / tối đa không phải số"]);
  });

  it("dòng trống là dòng không có giới hạn nào", () => {
    expect(emptyRow({ analyte: "a", unit: "", minValue: null, maxValue: null, notDetected: false, ndText: "", printNote: "", printText: "" })).toBe(true);
    expect(emptyRow({ analyte: "a", unit: "", minValue: 0, maxValue: null, notDetected: false, ndText: "", printNote: "", printText: "" })).toBe(false);
  });
});
