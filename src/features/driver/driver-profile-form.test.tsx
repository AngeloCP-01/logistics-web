import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { DriverProfileForm } from "./driver-profile-form";

const PROFILE = {
  userId: "u1", role: "driver", displayName: "Dan", phone: null, defaultAddressId: null,
  driver: { vehicleType: "car", licensePlate: "ABC123", isAvailable: false, profileComplete: true },
};

describe("DriverProfileForm", () => {
  it("submits vehicle type + license plate", async () => {
    let body: unknown;
    server.use(
      http.patch("/api/users/me/driver", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(PROFILE);
      }),
    );
    render(<DriverProfileForm />, { wrapper: QueryWrapper });
    await userEvent.selectOptions(screen.getByLabelText(/vehicle type/i), "car");
    await userEvent.type(screen.getByLabelText(/license plate/i), "ABC123");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(body).toEqual({ vehicleType: "car", licensePlate: "ABC123" }));
  });

  it("requires a license plate", async () => {
    render(<DriverProfileForm />, { wrapper: QueryWrapper });
    await userEvent.selectOptions(screen.getByLabelText(/vehicle type/i), "car");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(await screen.findByText(/license plate is required/i)).toBeInTheDocument();
  });
});
