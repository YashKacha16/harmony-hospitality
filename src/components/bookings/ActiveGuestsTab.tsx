import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Receipt, LogOut } from "lucide-react";
import type { BookingDto } from "@/api/services/bookingService";
import { useNavigate } from "@tanstack/react-router";
import { CheckoutDrawer } from "./CheckoutDrawer";

interface Props {
  bookings: BookingDto[];
}

export function ActiveGuestsTab({ bookings }: Props) {
  const navigate = useNavigate();
  const [checkoutBookingId, setCheckoutBookingId] = useState<number | null>(null);
  const [viewBillBookingId, setViewBillBookingId] = useState<number | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="mt-8 text-center text-muted-foreground">
        No active guests right now.
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {bookings.map(b => (
          <Card key={b.id} className="p-4 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="font-serif text-xl">{b.guestName}</div>
                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium">Checked-in</span>
              </div>
              
              <div className="text-sm font-medium mb-1">
                Room {b.room ? b.room.number : "Unassigned"}
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Out: {new Date(b.checkOutDate).toLocaleDateString()}</div>
                <div>Guests: {b.guests}</div>
                <div>Phone: {b.phone}</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-between items-center text-muted-foreground">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:text-primary"
                onClick={() => {
                  if (b.room) {
                    navigate({
                      to: "/orders",
                      search: {
                        tab: "room-service",
                        roomNumber: b.room.number
                      }
                    });
                  }
                }}
              >
                <Utensils className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:text-primary"
                onClick={() => setViewBillBookingId(b.id)}
              >
                <Receipt className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:text-[color:var(--warning)]"
                onClick={() => setCheckoutBookingId(b.id)}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <CheckoutDrawer 
        bookingId={checkoutBookingId} 
        open={checkoutBookingId !== null} 
        onOpenChange={(open) => !open && setCheckoutBookingId(null)} 
      />
      <CheckoutDrawer 
        bookingId={viewBillBookingId} 
        open={viewBillBookingId !== null} 
        onOpenChange={(open) => !open && setViewBillBookingId(null)} 
        mode="view"
      />
    </>
  );
}
