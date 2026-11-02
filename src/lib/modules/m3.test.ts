import { describe, expect, it } from "vitest";
import { contaminationRate, pct, survivalRate } from "./m3/rates";
import { columnsMapping, qualifiedTable } from "@/lib/platform/data/factory";
import { permissionForEntity, roleAllows } from "@/lib/platform/permissions";

describe("M3 tỷ lệ", () => {
  it("tỷ lệ nhiễm và tỷ lệ sống, 1 chữ số thập phân", () => {
    expect(contaminationRate({ contaminated: 3, vessels: 40 })).toBe(7.5);
    expect(survivalRate({ survived: 2, quantity: 3 })).toBe(66.7);
  });

  it("mẫu số 0 → chưa có dữ liệu", () => {
    expect(pct(0, 0)).toBeNull();
    expect(contaminationRate({ contaminated: 0, vessels: 0 })).toBeNull();
  });
});

describe("schema phân hệ", () => {
  it("tên bảng có schema được trích dẫn đúng", () => {
    expect(qualifiedTable("customers")).toBe('public."customers"');
    expect(qualifiedTable("m3_tissue.culture_batches")).toBe('"m3_tissue"."culture_batches"');
  });

  it("khóa ngoại chưa chọn ghi null, không ghi chuỗi rỗng", () => {
    const m = columnsMapping<{ id: string; code: string; customerId: string }>("m3_tissue.orders", { code: "text", customerId: "ref" });
    expect(m.toRow({ code: "DH-1", customerId: "" })).toEqual({ code: "DH-1", customer_id: null });
    expect(m.toRow({ customerId: "abc" })).toEqual({ customer_id: "abc" });
  });

  it("quyền ghi theo phân hệ", () => {
    expect(permissionForEntity("customers")).toBe("write.reception");
    expect(permissionForEntity("culture-batches")).toBe("write.tissue");
    expect(permissionForEntity("varieties")).toBe("write.breeding");
    expect(roleAllows(["Nuôi cấy mô"], "write.tissue")).toBe(true);
    expect(roleAllows(["NV phân tích"], "write.tissue")).toBe(false);
    expect(roleAllows(["Nuôi cấy mô"], "write.breeding")).toBe(false);
  });
});
