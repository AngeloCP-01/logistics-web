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
