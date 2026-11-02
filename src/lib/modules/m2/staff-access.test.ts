import { describe, expect, it } from "vitest";
import { deniedFromKeys, keysFromDenied, mergeRoles } from "./staff-access";

describe("vai trò và quyền cụ thể của nhân viên", () => {
  it("giữ vai trò phân hệ khác, thay vai trò M2", () => {
    expect(mergeRoles(["Giống", "NV phân tích"], ["Quản lý"])).toEqual(["Giống", "Quản lý"]);
    expect(mergeRoles(["Quản trị"], [])).toEqual([]);
  });

  it("đổi qua lại giữa ô tích và quyền bị chặn", () => {
    expect(deniedFromKeys(["approve", "stats"])).toEqual(["view.stats", "results.qa", "results.approve"]);
    expect(keysFromDenied(["results.qa", "results.approve", "view.customers"])).toEqual(["customers", "approve"]);
    expect(keysFromDenied(["results.qa"])).toEqual([]);
  });
});
