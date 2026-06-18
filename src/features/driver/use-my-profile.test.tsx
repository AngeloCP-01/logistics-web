import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useMyProfile } from "./use-my-profile";

const PROFILE = {
  userId: "u1",
  role: "driver",
  displayName: "Dan Driver",
  phone: null,
  defaultAddressId: null,
  driver: { vehicleType: "car", licensePlate: "ABC123", isAvailable: false, profileComplete: true },
};

describe("useMyProfile", () => {
  it("returns the driver profile", async () => {
    server.use(http.get("/api/users/me", () => HttpResponse.json(PROFILE)));
    const { result } = renderHook(() => useMyProfile(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.driver?.profileComplete).toBe(true);
  });
});
