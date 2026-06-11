import { Link } from "react-router-dom";
export function Forbidden() {
  return <div className="p-8"><h1 className="text-2xl font-semibold">Not allowed</h1><p className="text-muted-foreground">You don’t have access to that area.</p><Link className="text-primary underline" to="/">Go home</Link></div>;
}
