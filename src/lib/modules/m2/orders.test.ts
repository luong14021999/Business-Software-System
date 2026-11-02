import { describe, expect, it } from "vitest";
import { addDays, averageReplicates, balance, cellText, compareLimit, judge, nextQuoteCode, quoteItemsTotal, outOfMethodRange, parseFactorFormula, roundForPrint, specLimitText, isoWeek, legacySampleStatus, limitText, nextBatchCode, nextOrderCode, nextSampleCodes, normSummary, orderTotals, overdueDays, parseResultCell, quoteLines, weekOf } from "./orders";
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

describe("mẻ thử nghiệm & lịch công tác", () => {
  it("mã mẻ theo tháng", () => {
    expect(nextBatchCode("2026-11-02", ["2026.11.001", "2026.11.007", "2026.10.020"])).toBe("2026.11.008");
    expect(nextBatchCode("2026-12-01", [])).toBe("2026.12.001");
  });
  it("tuần bắt đầu từ thứ 2", () => {
    const w = weekOf("2026-11-01"); // chủ nhật
    expect(w[0]).toEqual({ iso: "2026-10-26", label: "Thứ 2 - 26/10" });
    expect(w[6]).toEqual({ iso: "2026-11-01", label: "Chủ nhật - 1/11" });
    expect(addDays("2026-12-30", 7)).toBe("2027-01-06");
  });
  it("số tuần ISO", () => {
    expect(isoWeek("2026-10-26")).toBe(44);
    expect(isoWeek("2026-01-01")).toBe(1);
  });
});

describe("báo giá & công nợ", () => {
  it("giảm giá trước, thuế sau, làm tròn đồng", () => {
    expect(orderTotals(1_000_000, 10, 8)).toEqual({ sub: 1_000_000, discount: 100_000, afterDiscount: 900_000, vat: 72_000, total: 972_000 });
    expect(orderTotals(333_333, 0, 0).total).toBe(333_333);
    expect(orderTotals(100, 150, -5)).toEqual({ sub: 100, discount: 100, afterDiscount: 0, vat: 0, total: 0 });
  });
  it("còn lại không âm", () => {
    expect(balance(1_000_000, [{ amount: 300_000 }, { amount: 200_000 }])).toEqual({ paid: 500_000, remaining: 500_000 });
    expect(balance(100, [{ amount: 500 }]).remaining).toBe(0);
  });
  it("bảng kê gộp theo loại mẫu + chỉ tiêu", () => {
    const q = quoteLines(
      [
        { criterion: "pH", unit: "-", matrix: "Đất" },
        { criterion: "pH", unit: "-", matrix: "Đất" },
        { criterion: "pH", unit: "-", matrix: "Nước mặt" },
        { criterion: "COD", unit: "mg/L", matrix: "Nước mặt" },
      ],
      (m, c) => (c === "pH" ? (m === "Đất" ? 50_000 : 40_000) : 0),
    );
    expect(q).toEqual([
      { matrix: "Đất", criterion: "pH", unit: "-", samples: 2, unitPrice: 50_000, amount: 100_000 },
      { matrix: "Nước mặt", criterion: "pH", unit: "-", samples: 1, unitPrice: 40_000, amount: 40_000 },
      { matrix: "Nước mặt", criterion: "COD", unit: "mg/L", samples: 1, unitPrice: 0, amount: 0 },
    ]);
  });
});

describe("thống kê định mức", () => {
  it("số lượt × định mức, giảm trừ trên tổng, báo chỉ tiêu chưa có định mức", () => {
    const r = normSummary(
      [
        { matrix: "Đất", criterion: "pH" },
        { matrix: "Đất", criterion: "pH" },
        { matrix: "Đất", criterion: "N" },
      ],
      (m, c) => (c === "pH" ? 100_000 : undefined),
      10,
    );
    expect(r.rows).toEqual([
      { analyte: "pH (Đất)", count: 2, rate: 100_000, amount: 200_000 },
      { analyte: "N (Đất)", count: 1, rate: 0, amount: 0 },
    ]);
    expect([r.gross, r.deduction, r.net]).toEqual([200_000, 20_000, 180_000]);
    expect(r.missing).toEqual(["Đất · N"]);
  });
});

describe("danh mục chi tiết (GĐ5)", () => {
  it("làm tròn khi in theo độ lớn", () => {
    const r = { lt0_1: 3, lt1: 2, lt10: 2, lt100: 1, lt1000: 0, ge1000: 0 };
    expect(roundForPrint(0.0569, r)).toBe("0,057");
    expect(roundForPrint(7.256, r)).toBe("7,26");
    expect(roundForPrint(56.78, r)).toBe("56,8");
    expect(roundForPrint(1234.5, r)).toBe("1.235");
    expect(roundForPrint(0.5, null)).toBe("0,5");
  });
  it("công thức cột Cmax: chỉ nhận chuỗi *số, /số", () => {
    expect(parseFactorFormula("*0.9*1.2")?.(40)).toBe(43.2);
    expect(parseFactorFormula("* 0,9 / 2")?.(10)).toBe(4.5);
    expect(parseFactorFormula("+1")).toBeNull();
    expect(parseFactorFormula("*0.9;alert(1)")).toBeNull();
    expect(parseFactorFormula("/0")).toBeNull();
  });
  it("ngoài giới hạn phương pháp", () => {
    expect(outOfMethodRange(0.01, "", 0.05, 100)).toBe(true);
    expect(outOfMethodRange(150, "", 0.05, 100)).toBe(true);
    expect(outOfMethodRange(5, "", 0.05, null)).toBe(false);
    expect(outOfMethodRange(0.01, "<", 0.05, 100)).toBe(false);
  });
  it("giới hạn quy chuẩn dạng chữ", () => {
    expect(specLimitText({ minValue: 0, maxValue: 0, notDetected: true, ndText: "Không mùi" })).toBe("Không mùi");
    expect(specLimitText({ minValue: 0, maxValue: 0, notDetected: true })).toBe("KPH");
    expect(specLimitText({ minValue: 0, maxValue: 0 })).toBe("-");
    expect(specLimitText({ minValue: 5, maxValue: null })).toBe("≥ 5");
  });
});

describe("đánh giá theo quy chuẩn", () => {
  it("quy chuẩn không phát hiện: chỉ KPH, <giới hạn, 0 là đạt", () => {
    expect(judge({ prefix: "KPH", value: NaN }, { min: null, max: null, ndRequired: true })).toBe("Đạt");
    expect(judge({ prefix: "<", value: 0.01 }, { min: null, max: null, ndRequired: true })).toBe("Đạt");
    expect(judge({ prefix: "", value: 0.2 }, { min: null, max: null, ndRequired: true })).toBe("Vượt");
    expect(judge({ prefix: "", value: 9 }, { min: 6.5, max: 8.5 })).toBe("Vượt");
    expect(judge(null, { min: 1, max: 2 })).toBe("");
  });
});

describe("báo giá nhiều phiên bản", () => {
  it("số báo giá tăng theo đơn", () => {
    expect(nextQuoteCode("26.6", ["26.6/BG.1", "26.6/BG.3", "26.5/BG.9"])).toBe("26.6/BG.4");
    expect(nextQuoteCode("26.7", [])).toBe("26.7/BG.1");
  });
  it("tổng từ dòng: số lượng × đơn giá, giảm giá rồi thuế", () => {
    const t = quoteItemsTotal([{ label: "pH", unit: "mẫu", quantity: 3, unitPrice: 50_000 }, { label: "Ăn ở", unit: "người × ngày", quantity: 2, unitPrice: 200_000 }], 10, 8);
    expect([t.sub, t.discount, t.vat, t.total]).toEqual([550_000, 55_000, 39_600, 534_600]);
  });
});

describe("nhiều lần đo (GĐ7)", () => {
  it("trung bình các lần đo, bỏ ô trống", () => {
    expect(averageReplicates(["7,2", "7,4", ""])).toEqual({ prefix: "", value: 7.3, n: 2 });
    expect(cellText(averageReplicates(["1", "2", "2"]))).toBe("1,666667");
  });
  it("KPH và nhỏ hơn giới hạn", () => {
    expect(cellText(averageReplicates(["KPH", "kph"]))).toBe("KPH");
    expect(cellText(averageReplicates(["<0,05", "<0,1"]))).toBe("<0,1");
    expect(averageReplicates(["<0,05", "0,15"])).toEqual({ prefix: "", value: 0.1, n: 2 });
    expect(averageReplicates(["KPH", "0,2"])).toEqual({ prefix: "", value: 0.2, n: 2 });
  });
  it("chưa có hoặc sai số", () => {
    expect(averageReplicates(["", " "])).toBeNull();
    expect(averageReplicates(["7", "abc"])).toBeNull();
    expect(permissionForEntity("order-plan-items")).toBe("write.reception");
  });
});
