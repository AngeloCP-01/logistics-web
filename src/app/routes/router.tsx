import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/app/shell/app-shell";
import { RequireRole } from "./require-role";
import { ErrorElement } from "@/app/error-element";
import { NotFound } from "@/app/not-found";
import { Forbidden } from "@/app/forbidden";
import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { CustomerHome } from "@/features/home/customer-home";
import { PlaceOrderPage } from "@/features/orders/place-order-page";
import { MyOrdersPage } from "@/features/orders/my-orders-page";
import { OrderDetailPage } from "@/features/orders/order-detail-page";
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
      {
        element: <RequireRole role="customer" />,
        children: [
          { index: true, element: <CustomerHome /> },
          { path: "orders/new", element: <PlaceOrderPage /> },
          { path: "orders", element: <MyOrdersPage /> },
          { path: "orders/:id", element: <OrderDetailPage /> },
        ],
      },
      { element: <RequireRole role="driver" />, children: [{ path: "driver", element: <DriverHome /> }] },
      { element: <RequireRole role="admin" />, children: [{ path: "admin/orders", element: <AdminHome /> }] },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export { Navigate };
