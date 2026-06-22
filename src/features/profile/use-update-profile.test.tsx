import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useUpdateProfile } from "./use-update-profile";

describe("useUpdateProfile", () => {
  it("PATCHes display name + phone and returns the profile", async () => {
    let body: unknown;
    server.use(http.patch("/api/users/me", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ userId: "u1", role: "customer", displayName: "New Name", phone: "0917 555 1234", defaultAddressId: null, driver: null });
    }));
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: QueryWrapper });
    result.current.mutate({ displayName: "New Name", phone: "0917 555 1234" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toEqual({ displayName: "New Name", phone: "0917 555 1234" });
    expect(result.current.data?.displayName).toBe("New Name");
  });
});
