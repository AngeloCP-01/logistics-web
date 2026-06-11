interface AddressLike {
  label?: string | null;
  street: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
}

export function formatAddress(a: AddressLike): string {
  return `${a.street}, ${a.city}, ${a.country}`;
}

export function formatAddressLabel(a: AddressLike): string {
  return a.label ? `${a.label} — ${formatAddress(a)}` : formatAddress(a);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}
