import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { registerSchema, type RegisterValues } from "./schemas";
import { registerRequest } from "./session";
import { useAuthStore } from "./auth-store";
import { homePathFor } from "@/app/routes/role-home";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function RegisterPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "customer" },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      await registerRequest(values);
      navigate(homePathFor(useAuthStore.getState().user!.role), { replace: true });
    } catch (e) {
      setFormError(e instanceof ApiError ? e.title : "Registration failed");
    }
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-sm rounded-lg border p-6">
      <h1 className="mb-4 text-xl font-semibold">Create account</h1>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">I am a</Label>
          <select id="role" className="h-9 w-full rounded-md border bg-background px-3 text-sm" {...register("role")}>
            <option value="customer">Customer</option>
            <option value="driver">Driver</option>
          </select>
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>Create account</Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Have an account? <Link className="text-primary underline" to="/login">Sign in</Link>
      </p>
    </div>
  );
}
