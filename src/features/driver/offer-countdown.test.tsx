import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { OfferCountdown } from "./offer-countdown";

beforeEach(() => vi.useFakeTimers({ now: new Date("2026-06-18T12:00:00Z") }));
afterEach(() => vi.useRealTimers());

describe("OfferCountdown", () => {
  it("shows the remaining seconds", () => {
    render(<OfferCountdown expiresAt="2026-06-18T12:00:30Z" />);
    expect(screen.getByText(/expires in 30s/i)).toBeInTheDocument();
  });

  it("counts down and fires onExpire at zero", () => {
    const onExpire = vi.fn();
    render(<OfferCountdown expiresAt="2026-06-18T12:00:02Z" onExpire={onExpire} />);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
