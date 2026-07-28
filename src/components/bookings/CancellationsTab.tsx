import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/api/services/bookingService";

export function CancellationsTab() {
  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings", "Cancelled"],
    queryFn: () => bookingService.getAll("Cancelled"),
  });

  return (
    <Card className="rounded-2xl overflow-hidden mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
              <th className="px-4 py-3">Booking ID</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Advance</th>
              <th className="px-4 py-3 text-right">Refund Amount</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No cancelled bookings found.
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-muted/10">
                <td className="px-4 py-3 font-medium">#{b.bookingCode || b.id}</td>
                <td className="px-4 py-3">{b.guestName}</td>
                <td className="px-4 py-3">{b.room ? `Room ${b.room.number}` : "-"}</td>
                <td className="px-4 py-3">{new Date(b.checkInDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">${b.advanceAmount}</td>
                <td className="px-4 py-3 text-right text-destructive font-medium">
                  {b.refundAmount != null ? `$${b.refundAmount}` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
