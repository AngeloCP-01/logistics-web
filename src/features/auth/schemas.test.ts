import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "./schemas";

describe("auth schemas", () => {
  it("accepts a valid login", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "secret12" }).success).toBe(true);
  });
  it("rejects a short password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(false);
  });
  it("register requires a role of customer or driver", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "secret12", role: "admin" }).success).toBe(false);
    expect(registerSchema.safeParse({ email: "a@b.com", password: "secret12", role: "driver" }).success).toBe(true);
  });
});
