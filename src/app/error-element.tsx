import { useRouteError, isRouteErrorResponse } from "react-router-dom";
export function ErrorElement() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? error.statusText : error instanceof Error ? error.message : "Unexpected error";
  return <div className="p-8"><h1 className="text-2xl font-semibold">Something went wrong</h1><p className="text-muted-foreground">{message}</p></div>;
}
