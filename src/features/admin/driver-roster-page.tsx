import { useAvailableDrivers } from "./use-dispatch-admin";
import { formatDateTime } from "@/shared/lib/format";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export function DriverRosterPage() {
  const { data, isLoading, isError } = useAvailableDrivers();
  const drivers = data?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Drivers</h1>
        <p className="text-sm text-muted-foreground">Currently-online drivers available for dispatch.</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load drivers.</p>
      ) : drivers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No drivers are online right now.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Online since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => (
              <TableRow key={d.driverId}>
                <TableCell>{d.displayName}</TableCell>
                <TableCell className="text-muted-foreground">{d.vehicleType ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDateTime(d.availableSince)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
