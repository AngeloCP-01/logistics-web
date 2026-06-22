import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import type { ApiError } from "@/shared/api/api-error";
import { useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from "./use-address-mutations";

const ADDR = { id: "a1", userId: "u1", label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121 };

describe("useUpdateAddress", () => {
  it("PATCHes the address fields", async () => {
    let body: unknown;
    server.use(http.patch("/api/users/me/addresses/a1", async ({ request }) => { body = await request.json(); return HttpResponse.json(ADDR); }));
    const { result } = renderHook(() => useUpdateAddress(), { wrapper: QueryWrapper });
    result.current.mutate({ id: "a1", input: { label: "Office", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((body as { label: string }).label).toBe("Office");
  });
});

describe("useDeleteAddress", () => {
  it("DELETEs and resolves on 204", async () => {
    server.use(http.delete("/api/users/me/addresses/a1", () => new HttpResponse(null, { status: 204 })));
    const { result } = renderHook(() => useDeleteAddress(), { wrapper: QueryWrapper });
    result.current.mutate("a1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("surfaces a 409 when deleting the default address", async () => {
    server.use(http.delete("/api/users/me/addresses/a1", () => HttpResponse.json({ title: "Default address in use", status: 409 }, { status: 409 })));
    const { result } = renderHook(() => useDeleteAddress(), { wrapper: QueryWrapper });
    result.current.mutate("a1");
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).status).toBe(409);
  });
});

describe("useSetDefaultAddress", () => {
  it("PUTs the addressId", async () => {
    let body: unknown;
    server.use(http.put("/api/users/me/default-address", async ({ request }) => { body = await request.json(); return HttpResponse.json({ userId: "u1", role: "customer", displayName: "C", phone: null, defaultAddressId: "a1", driver: null }); }));
    const { result } = renderHook(() => useSetDefaultAddress(), { wrapper: QueryWrapper });
    result.current.mutate("a1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toEqual({ addressId: "a1" });
  });
});
