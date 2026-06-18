import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { ApiError } from "@/shared/api/api-error";
import { useUpdateDriverProfile, useSetAvailability } from "./use-driver-mutations";

const PROFILE = {
  userId: "u1", role: "driver", displayName: "Dan", phone: null, defaultAddressId: null,
  driver: { vehicleType: "car", licensePlate: "ABC123", isAvailable: true, profileComplete: true },
};

describe("useUpdateDriverProfile", () => {
  it("PATCHes the driver attributes and returns the profile", async () => {
    server.use(http.patch("/api/users/me/driver", () => HttpResponse.json(PROFILE)));
    const { result } = renderHook(() => useUpdateDriverProfile(), { wrapper: QueryWrapper });
    result.current.mutate({ vehicleType: "car", licensePlate: "ABC123" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.driver?.profileComplete).toBe(true);
  });
});

describe("useSetAvailability", () => {
  it("PUTs availability and returns the profile", async () => {
    server.use(http.put("/api/users/me/availability", () => HttpResponse.json(PROFILE)));
    const { result } = renderHook(() => useSetAvailability(), { wrapper: QueryWrapper });
    result.current.mutate(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.driver?.isAvailable).toBe(true);
  });

  it("surfaces a 409 when the driver profile is incomplete", async () => {
    server.use(
      http.put("/api/users/me/availability", () =>
        HttpResponse.json({ title: "Driver profile incomplete", status: 409 }, { status: 409 }),
      ),
    );
    const { result } = renderHook(() => useSetAvailability(), { wrapper: QueryWrapper });
    result.current.mutate(true);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(409);
  });
});
