import { describe, it, expect } from "vitest";
import { homePathFor } from "./role-home";

describe("homePathFor", () => {
  it("maps each role to its home", () => {
    expect(homePathFor("customer")).toBe("/");
    expect(homePathFor("driver")).toBe("/driver");
    expect(homePathFor("admin")).toBe("/admin/orders");
  });
});
