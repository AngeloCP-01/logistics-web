import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { AvailabilityToggle } from "./availability-toggle";

const PROFILE = (isAvailable: boolean) => ({
  userId: "u1", role: "driver", displayName: "Dan", phone: null, defaultAddressId: null,
  driver: { vehicleType: "car", licensePlate: "ABC123", isAvailable, profileComplete: true },
});

describe("AvailabilityToggle", () => {
  it("goes online when currently offline", async () => {
    let body: unknown;
    server.use(
      http.put("/api/users/me/availability", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(PROFILE(true));
      }),
    );
    render(<AvailabilityToggle isAvailable={false} />, { wrapper: QueryWrapper });
    await userEvent.click(screen.getByRole("button", { name: /go online/i }));
    await waitFor(() => expect(body).toEqual({ available: true }));
  });

  it("shows the offline→online affordance label by state", () => {
    render(<AvailabilityToggle isAvailable={true} />, { wrapper: QueryWrapper });
    expect(screen.getByRole("button", { name: /go offline/i })).toBeInTheDocument();
  });
});
