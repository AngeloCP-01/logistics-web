import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { QueryWrapper } from "@/test/query-wrapper";
import { useAuthStore } from "@/features/auth/auth-store";
import { CancelOrderDialog } from "./cancel-order-dialog";

function order(status: string) {
  return { id: "o1", customerId: "u1", status, pickup: {}, dropoff: {}, items: [], assignedDriverId: null, scheduledFor: null, cancelReason: "no longer needed", createdAt: "x", updatedAt: "x" };
}

beforeEach(() => useAuthStore.getState().setSession("t", { id: "u1", email: "c@x.com", role: "customer" }));

describe("CancelOrderDialog", () => {
  it("cancels with a reason and reports success", async () => {
    let body: unknown;
    server.use(http.post("/api/orders/o1/cancel", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(order("cancelled"));
    }));
    render(<CancelOrderDialog orderId="o1" />, { wrapper: QueryWrapper });

    await userEvent.click(screen.getByRole("button", { name: /cancel order/i }));
    await userEvent.type(screen.getByLabelText(/reason/i), "no longer needed");
    await userEvent.click(screen.getByRole("button", { name: /confirm cancellation/i }));

    await waitFor(() => expect(body).toEqual({ reason: "no longer needed" }));
  });
});
