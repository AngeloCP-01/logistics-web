import type { OrderStatus } from "@/features/orders/types";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (status: OrderStatus | "all") => [...orderKeys.lists(), status] as const,
  active: () => [...orderKeys.all, "active"] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export const addressKeys = {
  all: ["addresses"] as const,
  list: () => [...addressKeys.all, "list"] as const,
};

export const trackingKeys = {
  all: ["tracking"] as const,
  latest: (id: string) => [...trackingKeys.all, "latest", id] as const,
  route: (id: string) => [...trackingKeys.all, "route", id] as const,
};

export const driverKeys = {
  all: ["driver"] as const,
  profile: () => [...driverKeys.all, "profile"] as const,
  currentOffer: () => [...driverKeys.all, "currentOffer"] as const,
  assignment: (id: string) => [...driverKeys.all, "assignment", id] as const,
};

export const adminKeys = {
  all: ["admin"] as const,
  orders: (status: OrderStatus | "all") => [...adminKeys.all, "orders", status] as const,
  order: (id: string) => [...adminKeys.all, "order", id] as const,
  unassigned: () => [...adminKeys.all, "unassigned"] as const,
  availableDrivers: () => [...adminKeys.all, "availableDrivers"] as const,
  analytics: () => [...adminKeys.all, "analytics"] as const,
};
