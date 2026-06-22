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
import { TrackPage } from "@/features/tracking/track-page";
import { DriverTodayPage } from "@/features/driver/driver-today-page";
import { OfferPage } from "@/features/driver/offer-page";
import { ActiveDeliveryPage } from "@/features/driver/active-delivery-page";
import { AdminOrdersPage } from "@/features/admin/admin-orders-page";
import { AdminOrderDetailPage } from "@/features/admin/admin-order-detail-page";
import { ManualDispatchPage } from "@/features/admin/manual-dispatch-page";
import { DriverRosterPage } from "@/features/admin/driver-roster-page";
import { AdminAnalyticsPage } from "@/features/admin/admin-analytics-page";

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
          { path: "track/:orderId", element: <TrackPage /> },
        ],
      },
      {
        element: <RequireRole role="driver" />,
        children: [
          { path: "driver", element: <DriverTodayPage /> },
          { path: "driver/offers", element: <OfferPage /> },
          { path: "driver/active/:orderId", element: <ActiveDeliveryPage /> },
        ],
      },
      {
        element: <RequireRole role="admin" />,
        children: [
          { path: "admin/orders", element: <AdminOrdersPage /> },
          { path: "admin/orders/:id", element: <AdminOrderDetailPage /> },
          { path: "admin/dispatch", element: <ManualDispatchPage /> },
          { path: "admin/drivers", element: <DriverRosterPage /> },
          { path: "admin/analytics", element: <AdminAnalyticsPage /> },
          { path: "admin/track/:orderId", element: <TrackPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export { Navigate };
