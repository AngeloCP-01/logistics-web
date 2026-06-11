import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/app/shell/app-shell";
import { RequireRole } from "./require-role";
import { ErrorElement } from "@/app/error-element";
import { NotFound } from "@/app/not-found";
import { Forbidden } from "@/app/forbidden";
import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { CustomerHome } from "@/app/customer/customer-home";
import { DriverHome } from "@/app/driver/driver-home";
import { AdminHome } from "@/app/admin/admin-home";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage />, errorElement: <ErrorElement /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forbidden", element: <Forbidden /> },
  {
    element: <AppShell />,
    errorElement: <ErrorElement />,
    children: [
      { element: <RequireRole role="customer" />, children: [{ index: true, element: <CustomerHome /> }] },
      { element: <RequireRole role="driver" />, children: [{ path: "driver", element: <DriverHome /> }] },
      { element: <RequireRole role="admin" />, children: [{ path: "admin/orders", element: <AdminHome /> }] },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export { Navigate };
