import { describe, expect, it } from "vitest";
import { csvRow, isValidPhone, marginPct, normalizePhone, normalizeVi, safeUrl, sumByMonth } from "./format";

describe("định dạng dùng chung", () => {
  it("tỷ suất lợi nhuận; thiếu giá hoặc định mức → null", () => {
    expect(marginPct(400_000, 250_000)).toBe(37.5);
    expect(marginPct(200_000, 250_000)).toBe(-25);
    expect(marginPct(0, 100)).toBeNull();
    expect(marginPct(100, 0)).toBeNull();
  });
  it("cộng theo tháng", () => {
    const v = sumByMonth([{ d: "2026-01-05", v: 10 }, { d: "2026-01-20", v: 5 }, { d: "2025-12-31", v: 99 }], (x) => x.d, (x) => x.v, ["2026-01", "2026-02"]);
    expect(v).toEqual([15, 0]);
  });
  it("CSV: bọc ngoặc kép, chặn công thức Excel", () => {
    expect(csvRow(['a"b', 12, "=HYPERLINK(1)"])).toBe('"a""b","12","\'=HYPERLINK(1)"');
  });
  it("bỏ dấu tiếng Việt và ký tự lạ", () => {
    expect(normalizeVi("Nghiên cứu Giống LÚA chịu mặn – Đông Sơn!")).toBe("nghien cuu giong lua chiu man dong son");
  });
  it("chỉ cho phép liên kết http(s)", () => {
    expect(safeUrl("https://viennongnghiepthanhhoa.gov.vn/bm01.pdf")).toBe("https://viennongnghiepthanhhoa.gov.vn/bm01.pdf");
    expect(safeUrl("javascript:alert(1)")).toBe("");
    expect(safeUrl("data:text/html,x")).toBe("");
  });
  it("chuẩn hóa số điện thoại +84 → 0", () => {
    expect(normalizePhone("+84 912 345 678")).toBe("0912345678");
    expect(normalizePhone("0912.345.678")).toBe("0912345678");
    expect(isValidPhone("12345")).toBe(false);
  });
});
