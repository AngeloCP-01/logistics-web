import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequireRole } from "./require-role";
import { useAuthStore } from "@/features/auth/auth-store";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/forbidden" element={<div>forbidden page</div>} />
        <Route element={<RequireRole role="admin" />}>
          <Route path="/admin" element={<div>admin area</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => useAuthStore.getState().clear());

describe("RequireRole", () => {
  it("redirects an unauthenticated user to /login", () => {
    renderAt("/admin");
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("redirects a wrong-role user to /forbidden", () => {
    useAuthStore.getState().setSession("t", { id: "u1", email: "a@b.com", role: "customer" });
    renderAt("/admin");
    expect(screen.getByText("forbidden page")).toBeInTheDocument();
  });

  it("renders the outlet for the right role", () => {
    useAuthStore.getState().setSession("t", { id: "u1", email: "a@b.com", role: "admin" });
    renderAt("/admin");
    expect(screen.getByText("admin area")).toBeInTheDocument();
  });
});
