import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import type { ApiError } from "@/shared/api/api-error";
import { useAcceptOffer, useRejectOffer } from "./use-offer-actions";

describe("useAcceptOffer", () => {
  it("POSTs accept and resolves on 204", async () => {
    server.use(http.post("/api/dispatch/assignments/o1/accept", () => new HttpResponse(null, { status: 204 })));
    const { result } = renderHook(() => useAcceptOffer(), { wrapper: QueryWrapper });
    result.current.mutate("o1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("surfaces a 409 when the offer already advanced", async () => {
    server.use(
      http.post("/api/dispatch/assignments/o1/accept", () =>
        HttpResponse.json({ title: "Offer no longer available", status: 409 }, { status: 409 }),
      ),
    );
    const { result } = renderHook(() => useAcceptOffer(), { wrapper: QueryWrapper });
    result.current.mutate("o1");
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).status).toBe(409);
  });
});

describe("useRejectOffer", () => {
  it("POSTs reject and resolves on 204", async () => {
    server.use(http.post("/api/dispatch/assignments/o1/reject", () => new HttpResponse(null, { status: 204 })));
    const { result } = renderHook(() => useRejectOffer(), { wrapper: QueryWrapper });
    result.current.mutate("o1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
