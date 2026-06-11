import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { useAuthStore } from "./auth-store";
import { registerRequest } from "./session";

beforeEach(() => useAuthStore.getState().clear());

describe("registerRequest", () => {
  it("registers then auto-logs-in", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({ accessToken: "acc", user: { id: "u9", email: "n@b.com", role: "driver" } })),
    );
    server.use(http.post("/api/auth/register", () => HttpResponse.json({ userId: "u9" }, { status: 201 })));

    await registerRequest({ email: "n@b.com", password: "secret12", role: "driver" });

    expect(useAuthStore.getState().user?.id).toBe("u9");
  });
});
