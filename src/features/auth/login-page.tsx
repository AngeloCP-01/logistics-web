import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { loginSchema, type LoginValues } from "./schemas";
import { loginRequest } from "./session";
import { useAuthStore } from "./auth-store";
import { homePathFor } from "@/app/routes/role-home";
import { ApiError } from "@/shared/api/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function LoginPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await loginRequest(values);
      const role = useAuthStore.getState().user!.role;
      navigate(homePathFor(role), { replace: true });
    } catch (e) {
      setFormError(e instanceof ApiError ? e.title : "Login failed");
    }
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-sm rounded-lg border p-6">
      <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
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
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>Sign in</Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        No account? <Link className="text-primary underline" to="/register">Register</Link>
      </p>
    </div>
  );
}
