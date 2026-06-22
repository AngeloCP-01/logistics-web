import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { NotificationBell } from "./notification-bell";

function unread(n: number) {
  return { items: Array.from({ length: n }, (_, i) => ({ id: `n${i}`, type: "t", subject: "s", body: "b", data: {}, createdAt: "2026-06-22T00:00:00Z", readAt: null })), nextCursor: null };
}

function renderBell() {
  return render(<MemoryRouter><NotificationBell /></MemoryRouter>, { wrapper: QueryWrapper });
}

describe("NotificationBell", () => {
  it("links to /notifications", async () => {
    server.use(http.get("/api/notifications", () => HttpResponse.json(unread(0))));
    renderBell();
    expect(await screen.findByRole("link", { name: /notifications/i })).toHaveAttribute("href", "/notifications");
  });

  it("shows the unread count badge", async () => {
    server.use(http.get("/api/notifications", () => HttpResponse.json(unread(3))));
    renderBell();
    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("caps the badge at 9+", async () => {
    server.use(http.get("/api/notifications", () => HttpResponse.json(unread(12))));
    renderBell();
    expect(await screen.findByText("9+")).toBeInTheDocument();
  });

  it("shows no badge when there are no unread notifications", async () => {
    server.use(http.get("/api/notifications", () => HttpResponse.json(unread(0))));
    renderBell();
    await waitFor(() => expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument());
  });
});
