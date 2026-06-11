import { Link } from "react-router-dom";
export function NotFound() {
  return <div className="p-8"><h1 className="text-2xl font-semibold">Not found</h1><Link className="text-primary underline" to="/">Go home</Link></div>;
}
