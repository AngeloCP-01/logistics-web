import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { AddressPicker } from "./address-picker";
import type { ReactNode } from "react";

vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children, onClick }: { children?: ReactNode; onClick?: (e: { lngLat: { lat: number; lng: number } }) => void }) => (
    <div data-testid="map" onClick={() => onClick?.({ lngLat: { lat: 14.55, lng: 121.02 } })}>{children}</div>
  ),
  Marker: () => <div data-testid="pin" />,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const ADDR = { id: "a1", userId: "u1", label: "Home", street: "12 Mabini", city: "Manila", country: "PH", lat: 14.6, lng: 121 };

beforeEach(() => useAuthStore.getState().setSession("t", { id: "u1", email: "c@x.com", role: "customer" }));

describe("AddressPicker", () => {
  it("lists saved addresses and reports a selection", async () => {
    server.use(http.get("/api/users/me/addresses", () => HttpResponse.json({ items: [ADDR], nextCursor: null })));
    const onChange = vi.fn();
    render(<AddressPicker value="" onChange={onChange} />, { wrapper: QueryWrapper });

    await screen.findByRole("option", { name: /Home/ });
    await userEvent.selectOptions(screen.getByLabelText(/dropoff address/i), "a1");
    expect(onChange).toHaveBeenCalledWith("a1");
  });

  it("adds a new address inline and selects it", async () => {
    server.use(
      http.get("/api/users/me/addresses", () => HttpResponse.json({ items: [], nextCursor: null })),
      http.get("/api/geocode/reverse", () => HttpResponse.json({ lat: 14.55, lng: 121.02, street: "9 Office Rd", city: "Makati", country: "PH" })),
      http.post("/api/users/me/addresses", () => HttpResponse.json({ ...ADDR, id: "a2", label: "Office" }, { status: 201 })),
    );
    const onChange = vi.fn();
    render(<AddressPicker value="" onChange={onChange} />, { wrapper: QueryWrapper });

    await userEvent.click(screen.getByRole("button", { name: /add address/i }));
    await userEvent.type(screen.getByLabelText(/^label/i), "Office");
    await userEvent.click(screen.getByTestId("map"));
    await screen.findByTestId("pin");
    await userEvent.click(screen.getByRole("button", { name: /save address/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("a2"));
  });
});
