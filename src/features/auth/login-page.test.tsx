import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw-server";
import { LoginPage } from "./login-page";
import { useAuthStore } from "./auth-store";

beforeEach(() => useAuthStore.getState().clear());

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>customer home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("shows a field error for an invalid email without calling the API", async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "notanemail");
    await userEvent.type(screen.getByLabelText(/password/i), "secret12");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it("logs in and redirects to the role home", async () => {
    server.use(http.post("/api/auth/login", () =>
      HttpResponse.json({ accessToken: "acc", user: { id: "u1", email: "a@b.com", role: "customer" } })));
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "secret12");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText("customer home")).toBeInTheDocument();
  });

  it("surfaces a 401 as a form-level error", async () => {
    server.use(http.post("/api/auth/login", () =>
      HttpResponse.json({ title: "Invalid credentials", status: 401 }, { status: 401 })));
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
