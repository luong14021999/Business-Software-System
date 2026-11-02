import { describe, expect, it } from "vitest";
import { expandAccessories } from "./accessories";

const analytes = [
  { id: "a", name: "COD", sampleTypeId: "t", unit: "mg/L", method: "SMEWW 5220C" },
  { id: "b", name: "BOD5", sampleTypeId: "t", unit: "mg/L", method: "TCVN 6001" },
  { id: "c", name: "pH", sampleTypeId: "t", unit: "-", method: "TCVN 6492" },
];

describe("chỉ tiêu phụ", () => {
  it("thêm chỉ tiêu phụ ngay sau chỉ tiêu chính, bỏ chỉ tiêu đã có", () => {
    const out = expandAccessories([{ name: "COD", method: "SMEWW 5220C" }, { name: "pH" }], "t", analytes, [{ sampleTypeId: "t", mainAnalyteId: "a", method: "", accessoryIds: ["b", "c"] }]);
    expect(out.map((l) => l.name)).toEqual(["COD", "BOD5", "pH"]);
    expect(out[1]).toMatchObject({ unit: "mg/L", method: "TCVN 6001" });
  });

  it("chỉ áp khi đúng phương pháp và đúng loại mẫu", () => {
    const map = [{ sampleTypeId: "t", mainAnalyteId: "a", method: "SMEWW 5220C", accessoryIds: ["b"] }];
    expect(expandAccessories([{ name: "COD", method: "TCVN 6491" }], "t", analytes, map)).toHaveLength(1);
    expect(expandAccessories([{ name: "COD", method: "SMEWW 5220C" }], "khac", analytes, map)).toHaveLength(1);
    expect(expandAccessories([{ name: "cod", method: "smeww 5220c" }], "t", analytes, map)).toHaveLength(2);
  });
});
