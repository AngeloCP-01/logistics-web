import { describe, it, expect, beforeEach } from "vitest";
import { useDriverActiveStore } from "./driver-active-store";

beforeEach(() => {
  localStorage.clear();
  useDriverActiveStore.getState().clearActive();
});

describe("useDriverActiveStore", () => {
  it("sets and persists the active order id", () => {
    useDriverActiveStore.getState().setActive("o1");
    expect(useDriverActiveStore.getState().activeOrderId).toBe("o1");
    expect(localStorage.getItem("driver.activeOrderId")).toBe("o1");
  });

  it("clears the active order id and its persisted value", () => {
    useDriverActiveStore.getState().setActive("o1");
    useDriverActiveStore.getState().clearActive();
    expect(useDriverActiveStore.getState().activeOrderId).toBeNull();
    expect(localStorage.getItem("driver.activeOrderId")).toBeNull();
  });
});
