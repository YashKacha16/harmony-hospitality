import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import type { BookingDto } from "@/api/services/bookingService";
import { Search } from "lucide-react";
import { useState } from "react";

interface CompletedStaysTabProps {
  bookings: BookingDto[];
  currency: string;
}

export function CompletedStaysTab({ bookings, currency }: CompletedStaysTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBookings = bookings.filter((b) =>
    b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone.includes(searchQuery)
  );

  return (
    <Card className="flex-1 flex flex-col min-h-0 border-0 bg-background/50 shadow-sm backdrop-blur-sm">
      <CardContent className="flex-1 flex flex-col p-6 min-h-0 gap-4">
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guest or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded-xl border border-white/5 custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-md z-10">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Booking ID</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Guest</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Room</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dates</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">Total Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No completed stays found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-white/[0.02] border-white/5 transition-colors">
                    <TableCell className="font-medium text-foreground/90">{booking.bookingCode}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground/90">{booking.guestName}</span>
                        <span className="text-xs text-muted-foreground">{booking.phone}</span>
                        {booking.email && <span className="text-xs text-muted-foreground/70">{booking.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground/90">Room {booking.room?.number || '-'}</span>
                        <span className="text-xs text-muted-foreground">{booking.guests} Guests</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{format(parseISO(booking.checkInDate), "MM/dd/yyyy")}</span>
                        <span className="text-xs text-muted-foreground">to {format(parseISO(booking.checkOutDate), "MM/dd/yyyy")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground/80">{booking.source}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {booking.totalPaidAmount !== undefined && booking.totalPaidAmount !== null ? (
                        <span className="font-medium text-emerald-400">
                          {currency}{booking.totalPaidAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">No Record</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
