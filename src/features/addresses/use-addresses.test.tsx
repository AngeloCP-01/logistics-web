import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { useAddresses } from "./use-addresses";
import { useCreateAddress } from "./use-create-address";

const ADDR = { id: "a1", userId: "u1", label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121 };

beforeEach(() => {
  useAuthStore.getState().setSession("t", { id: "u1", email: "c@x.com", role: "customer" });
});

describe("useAddresses", () => {
  it("returns the saved addresses array", async () => {
    server.use(http.get("/api/users/me/addresses", () => HttpResponse.json({ items: [ADDR], nextCursor: null })));
    const { result } = renderHook(() => useAddresses(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([ADDR]);
  });
});

describe("useCreateAddress", () => {
  it("POSTs the new address and resolves to it", async () => {
    let body: unknown;
    server.use(
      http.post("/api/users/me/addresses", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(ADDR, { status: 201 });
      }),
    );
    const { result } = renderHook(() => useCreateAddress(), { wrapper: QueryWrapper });
    const created = await result.current.mutateAsync({
      label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121,
    });
    expect(created).toEqual(ADDR);
    expect(body).toMatchObject({ label: "Home", country: "PH" });
  });
});
