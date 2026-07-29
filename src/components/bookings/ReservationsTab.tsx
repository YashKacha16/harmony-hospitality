import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, AlertTriangle, UserCheck } from "lucide-react";
import type { BookingDto } from "@/api/services/bookingService";
import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/api/services/settingsService";

interface Props {
  bookings: BookingDto[];
  onCancel: (b: BookingDto) => void;
  onNoShow: (b: BookingDto) => void;
  onCheckIn: (b: BookingDto) => void;
}

export function ReservationsTab({ bookings, onCancel, onNoShow, onCheckIn }: Props) {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.getGeneralSettings(),
  });

  const currencySymbol = settings?.currency ? (settings.currency.match(/\(([^)]+)\)/)?.[1] || settings.currency) : "₹";

  return (
    <Card className="rounded-2xl overflow-hidden mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
              <th className="px-4 py-3">Booking ID</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Dates & Time</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Advance</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No upcoming reservations found.
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-muted/10">
                <td className="px-4 py-3 font-medium">#{b.bookingCode || b.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{b.guestName}</div>
                  <div className="text-xs text-muted-foreground">{b.phone}</div>
                </td>
                <td className="px-4 py-3">
                  {b.room ? (
                    <div>
                      <div className="font-medium">Room {b.room.number}</div>
                      <div className="text-xs text-muted-foreground">Cat {b.room.categoryId}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>{new Date(b.checkInDate).toLocaleDateString()} &rarr; {new Date(b.checkOutDate).toLocaleDateString()}</div>
                  <div className="text-xs text-muted-foreground">{b.checkInTime}</div>
                </td>
                <td className="px-4 py-3">{b.source}</td>
                <td className="px-4 py-3">{currencySymbol}{b.advanceAmount}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onCheckIn(b)} className="text-muted-foreground hover:text-emerald-500" title="Check-in Guest">
                      <UserCheck className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onCancel(b)} className="text-muted-foreground hover:text-destructive" title="Cancel Booking">
                      <Ban className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onNoShow(b)} className="text-muted-foreground hover:text-warning" title="Mark No-Show">
                      <AlertTriangle className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
