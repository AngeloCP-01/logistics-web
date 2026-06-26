import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useReverseGeocode } from "./use-reverse-geocode";

describe("useReverseGeocode", () => {
  it("resolves the geocoded location for a coordinate", async () => {
    server.use(
      http.get("/api/geocode/reverse", ({ request }) => {
        const u = new URL(request.url);
        expect(u.searchParams.get("lat")).toBe("14.5574");
        return HttpResponse.json({ lat: 14.5574, lng: 121.0089, street: "Dela Rosa", city: "Makati", country: "PH" });
      }),
    );
    const { result } = renderHook(() => useReverseGeocode(), { wrapper: QueryWrapper });
    result.current.mutate({ lat: 14.5574, lng: 121.0089 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ city: "Makati", country: "PH" });
  });

  it("surfaces an error when the endpoint fails", async () => {
    server.use(http.get("/api/geocode/reverse", () => new HttpResponse(null, { status: 502 })));
    const { result } = renderHook(() => useReverseGeocode(), { wrapper: QueryWrapper });
    result.current.mutate({ lat: 14.5, lng: 121 });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
