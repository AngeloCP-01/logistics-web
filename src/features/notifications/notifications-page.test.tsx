import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { NotificationsPage } from "./notifications-page";

function notif(id: string, readAt: string | null) {
  return { id, type: "order.created", subject: `Order ${id} update`, body: "Your order changed.", data: {}, createdAt: "2026-06-22T00:00:00Z", readAt };
}

function base() {
  server.use(
    http.get("/api/notifications/preferences", () => HttpResponse.json({ emailEnabled: true })),
  );
}

describe("NotificationsPage", () => {
  it("lists notifications and marks one read on click", async () => {
    let read = false;
    base();
    server.use(
      http.get("/api/notifications", () => HttpResponse.json({ items: [notif("n1", null)], nextCursor: null })),
      http.post("/api/notifications/n1/read", () => { read = true; return new HttpResponse(null, { status: 204 }); }),
    );
    render(<NotificationsPage />, { wrapper: QueryWrapper });
    await userEvent.click(await screen.findByRole("button", { name: /Order n1 update/i }));
    await waitFor(() => expect(read).toBe(true));
  });

  it("shows an empty state with no notifications", async () => {
    base();
    server.use(http.get("/api/notifications", () => HttpResponse.json({ items: [], nextCursor: null })));
    render(<NotificationsPage />, { wrapper: QueryWrapper });
    expect(await screen.findByText(/all caught up/i)).toBeInTheDocument();
  });

  it("toggles the email preference", async () => {
    let put: unknown;
    base();
    server.use(
      http.get("/api/notifications", () => HttpResponse.json({ items: [], nextCursor: null })),
      http.put("/api/notifications/preferences", async ({ request }) => { put = await request.json(); return HttpResponse.json({ emailEnabled: false }); }),
    );
    render(<NotificationsPage />, { wrapper: QueryWrapper });
    await userEvent.click(await screen.findByRole("button", { name: /toggle email notifications/i }));
    await waitFor(() => expect(put).toEqual({ emailEnabled: false }));
  });
});
