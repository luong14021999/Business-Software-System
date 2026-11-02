import { describe, expect, it } from "vitest";
import { readAnalyteRows } from "./analyte-io";

describe("nhập danh sách chỉ tiêu", () => {
  it("tìm dòng tiêu đề, đọc theo tên cột, báo dòng thiếu", () => {
    const { rows, errors } = readAnalyteRows([
      ["Danh sách chỉ tiêu"],
      ["TT", "Loại mẫu", "Tên", "Đơn vị", "Thứ tự", "Chỉ tiêu hiện trường", "Đơn giá"],
      ["1", "Nước mặt", "pH", "-", "1", "x", "50.000"],
      ["2", "", "COD", "mg/L", "", "", ""],
      ["", "", "", "", "", "", ""],
    ]);
    expect(rows).toEqual([expect.objectContaining({ type: "Nước mặt", name: "pH", unit: "-", sort: 1, isField: true, unitPrice: 50000 })]);
    expect(errors).toEqual(["Dòng 4: thiếu loại mẫu hoặc tên chỉ tiêu"]);
  });

  it("không có dòng tiêu đề thì báo lỗi", () => {
    expect(readAnalyteRows([["a", "b"]]).errors[0]).toContain("Không tìm thấy dòng tiêu đề");
  });
});
