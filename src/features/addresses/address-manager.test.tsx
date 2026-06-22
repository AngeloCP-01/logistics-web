import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { AddressManager } from "./address-manager";

const A1 = { id: "a1", userId: "u1", label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121 };
const A2 = { id: "a2", userId: "u1", label: "Office", street: "5 Ayala", city: "Makati", country: "PH", lat: 14.5, lng: 121 };

describe("AddressManager", () => {
  it("lists addresses with a default badge on the default one", async () => {
    server.use(http.get("/api/users/me/addresses", () => HttpResponse.json({ items: [A1, A2], nextCursor: null })));
    render(<AddressManager defaultAddressId="a1" />, { wrapper: QueryWrapper });
    expect(await screen.findByText(/12 Mabini/)).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("sets a non-default address as default", async () => {
    let put = false;
    server.use(
      http.get("/api/users/me/addresses", () => HttpResponse.json({ items: [A1, A2], nextCursor: null })),
      http.put("/api/users/me/default-address", () => { put = true; return HttpResponse.json({ userId: "u1", role: "customer", displayName: "C", phone: null, defaultAddressId: "a2", driver: null }); }),
    );
    render(<AddressManager defaultAddressId="a1" />, { wrapper: QueryWrapper });
    await screen.findByText(/5 Ayala/);
    await userEvent.click(screen.getByRole("button", { name: /set default for office/i }));
    await waitFor(() => expect(put).toBe(true));
  });

  it("deletes a non-default address", async () => {
    let del = false;
    server.use(
      http.get("/api/users/me/addresses", () => HttpResponse.json({ items: [A1, A2], nextCursor: null })),
      http.delete("/api/users/me/addresses/a2", () => { del = true; return new HttpResponse(null, { status: 204 }); }),
    );
    render(<AddressManager defaultAddressId="a1" />, { wrapper: QueryWrapper });
    await screen.findByText(/5 Ayala/);
    await userEvent.click(screen.getByRole("button", { name: /delete office/i }));
    await waitFor(() => expect(del).toBe(true));
  });
});
