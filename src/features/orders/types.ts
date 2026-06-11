import type { components } from "@/shared/api/types/order";

export type Order = components["schemas"]["Order"];
export type OrderStatus = Order["status"];
export type OrderPage = components["schemas"]["OrderPage"];
export type CreateOrderRequest = components["schemas"]["CreateOrderRequest"];
export type OrderAddress = Order["pickup"];
export type OrderItem = Order["items"][number];
