import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { router } from "./routes/router";
import { queryClient } from "@/shared/api/query-client";
import { bootstrapSession } from "@/features/auth/session";

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void bootstrapSession().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
