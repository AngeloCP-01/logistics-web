import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters").max(128),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema.extend({
  role: z.enum(["customer", "driver"]),
});
export type RegisterValues = z.infer<typeof registerSchema>;
