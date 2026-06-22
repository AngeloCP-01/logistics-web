import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from "./use-notifications";

function notif(id: string, readAt: string | null) {
  return { id, type: "order.created", subject: `Subject ${id}`, body: "Body", data: {}, createdAt: "2026-06-22T00:00:00Z", readAt };
}

describe("useNotifications", () => {
  it("lists the feed", async () => {
    server.use(http.get("/api/notifications", () => HttpResponse.json({ items: [notif("n1", null), notif("n2", "2026-06-22T01:00:00Z")], nextCursor: null })));
    const { result } = renderHook(() => useNotifications(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.items).toHaveLength(2);
  });
});

describe("useUnreadCount", () => {
  it("returns the number of unread items", async () => {
    server.use(http.get("/api/notifications", ({ request }) => {
      expect(new URL(request.url).searchParams.get("status")).toBe("unread");
      return HttpResponse.json({ items: [notif("n1", null), notif("n3", null)], nextCursor: null });
    }));
    const { result } = renderHook(() => useUnreadCount(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(2);
  });
});

describe("useMarkRead", () => {
  it("POSTs the read endpoint", async () => {
    let hit = false;
    server.use(http.post("/api/notifications/n1/read", () => { hit = true; return new HttpResponse(null, { status: 204 }); }));
    const { result } = renderHook(() => useMarkRead(), { wrapper: QueryWrapper });
    result.current.mutate("n1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(hit).toBe(true);
  });
});

describe("useMarkAllRead", () => {
  it("marks every unread notification read", async () => {
    const read: string[] = [];
    server.use(
      http.get("/api/notifications", () => HttpResponse.json({ items: [notif("n1", null), notif("n2", null)], nextCursor: null })),
      http.post("/api/notifications/:id/read", ({ params }) => { read.push(params.id as string); return new HttpResponse(null, { status: 204 }); }),
    );
    const { result } = renderHook(() => useMarkAllRead(), { wrapper: QueryWrapper });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(read.sort()).toEqual(["n1", "n2"]);
  });
});
