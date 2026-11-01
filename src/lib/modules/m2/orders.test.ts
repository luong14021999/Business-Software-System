import { describe, expect, it } from "vitest";
import { compareLimit, legacySampleStatus, limitText, nextOrderCode, nextSampleCodes, overdueDays, parseResultCell } from "./orders";
import { permissionForEntity } from "@/lib/platform/permissions";

describe("đơn hàng", () => {
  it("mã đơn kế tiếp theo năm, bỏ qua năm khác", () => {
    expect(nextOrderCode(2026, ["26.1", "26.6", "25.9", "26.x"])).toBe("26.7");
    expect(nextOrderCode(2027, ["26.6"])).toBe("27.1");
  });
  it("mã mẫu theo tiền tố loại mẫu + ngày, nối tiếp số đã dùng", () => {
    expect(nextSampleCodes("NM", "2026-07-30", ["NM300726-001", "NM300726-004", "NT300726-009", "NM290726-007"], 2)).toEqual(["NM300726-005", "NM300726-006"]);
    expect(nextSampleCodes("Đ", "2026-01-05", [], 1)).toEqual(["Đ050126-001"]);
  });
  it("trạng thái tiếp nhận cũ suy ra từ trạng thái yêu cầu", () => {
    expect(legacySampleStatus("Nhận mẫu")).toBe("Đã tiếp nhận");
    expect(legacySampleStatus("Đợi duyệt")).toBe("Chờ duyệt");
    expect(legacySampleStatus("Trả kết quả")).toBe("Đã trả KQ");
  });
  it("quá hạn tính theo ngày", () => {
    expect(overdueDays("2026-07-31T09:10:00", "2026-11-02")).toBe(94);
    expect(overdueDays("2026-12-01", "2026-11-02")).toBe(0);
    expect(overdueDays(null, "2026-11-02")).toBe(0);
  });
  it("quyền ghi đơn hàng thuộc bộ phận tiếp nhận; danh mục thuộc QA/QC", () => {
    expect(permissionForEntity("orders")).toBe("write.reception");
    expect(permissionForEntity("lab-analytes")).toBe("write.quality");
    expect(permissionForEntity("specification-limits")).toBe("write.quality");
  });
});

describe("kết quả và quy chuẩn", () => {
  it("đọc ô kết quả: số kiểu Việt / Anh, tiền tố <, >, KPH", () => {
    expect(parseResultCell("7,25")).toEqual({ prefix: "", value: 7.25 });
    expect(parseResultCell("1.234,5")).toEqual({ prefix: "", value: 1234.5 });
    expect(parseResultCell("< 0,05")).toEqual({ prefix: "<", value: 0.05 });
    expect(parseResultCell("kph")?.prefix).toBe("KPH");
    expect(parseResultCell("")).toBeNull();
    expect(parseResultCell("abc")).toBeNull();
  });
  it("so với giới hạn: khoảng, chỉ tối đa, chỉ tối thiểu", () => {
    expect(compareLimit(7, 6.5, 8.5)).toBe("Đạt");
    expect(compareLimit(9, 6.5, 8.5)).toBe("Vượt");
    expect(compareLimit(60, null, 50)).toBe("Vượt");
    expect(compareLimit(3, 4, null)).toBe("Vượt");
    expect(compareLimit(0.05, null, 0.1, "<")).toBe("Đạt");
    expect(compareLimit(NaN, null, 0.1, "KPH")).toBe("Đạt");
    expect(compareLimit(5, null, null)).toBe("");
    expect(compareLimit(NaN, null, null, "KPH")).toBe("");
  });
  it("giới hạn dạng chữ", () => {
    expect(limitText(6.5, 8.5)).toBe("6,5 – 8,5");
    expect(limitText(null, 50)).toBe("≤ 50");
    expect(limitText(4, null)).toBe("≥ 4");
  });
});
