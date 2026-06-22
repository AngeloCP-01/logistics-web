import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { ProfilePage } from "./profile-page";

const PROFILE = { userId: "u1", role: "customer", displayName: "Cara Customer", phone: "0917 000 0000", defaultAddressId: "a1", driver: null };

beforeEach(() => useAuthStore.getState().setSession("t", { id: "u1", email: "c@x.com", role: "customer" }));

function renderPage() {
  server.use(http.get("/api/users/me/addresses", () => HttpResponse.json({ items: [], nextCursor: null })));
  return render(<ProfilePage />, { wrapper: QueryWrapper });
}

describe("ProfilePage", () => {
  it("prefills and saves display name + phone", async () => {
    let body: unknown;
    server.use(
      http.get("/api/users/me", () => HttpResponse.json(PROFILE)),
      http.patch("/api/users/me", async ({ request }) => { body = await request.json(); return HttpResponse.json({ ...PROFILE, displayName: "Cara C" }); }),
    );
    renderPage();
    const name = await screen.findByLabelText(/display name/i);
    expect(name).toHaveValue("Cara Customer");
    await userEvent.clear(name);
    await userEvent.type(name, "Cara C");
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));
    await waitFor(() => expect((body as { displayName: string }).displayName).toBe("Cara C"));
  });

  it("shows an error message when the profile fails to load", async () => {
    server.use(http.get("/api/users/me", () => HttpResponse.json({ title: "x", status: 500 }, { status: 500 })));
    renderPage();
    expect(await screen.findByText(/could not load your profile/i)).toBeInTheDocument();
  });
});
