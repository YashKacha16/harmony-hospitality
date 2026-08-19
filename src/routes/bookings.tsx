import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService, type BookingDto } from "@/api/services/bookingService";
import { settingsService } from "@/api/services/settingsService";
import { extractCurrencySymbol } from "@/lib/utils";
import { permissionService } from "@/lib/permissionService";
import { ReservationsTab } from "@/components/bookings/ReservationsTab";
import { ActiveGuestsTab } from "@/components/bookings/ActiveGuestsTab";
import { CancellationsTab } from "@/components/bookings/CancellationsTab";
import { NoShowsTab } from "@/components/bookings/NoShowsTab";
import { CompletedStaysTab } from "@/components/bookings/CompletedStaysTab";
import { NewCheckInDrawer } from "@/components/bookings/NewCheckInDrawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const [activeTab, setActiveTab] = useState("reservations");
  const [cancelBooking, setCancelBooking] = useState<BookingDto | null>(null);
  const [noShowBooking, setNoShowBooking] = useState<BookingDto | null>(null);

  const userRaw = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
  const user = userRaw ? JSON.parse(userRaw) : { role: "Admin" };
  const canAdd = permissionService.hasPermission(user.role, "bookings", "add");
  const canDelete = permissionService.hasPermission(user.role, "bookings", "delete");
  const canEdit = permissionService.hasPermission(user.role, "bookings", "edit");

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: settingsService.getGeneralSettings });
  const currency = extractCurrencySymbol(settings?.currency);
  
  const queryClient = useQueryClient();

  const { data: upcomingBookings = [] } = useQuery({
    queryKey: ["bookings", "Confirmed"],
    queryFn: () => bookingService.getAll("Confirmed"),
  });

  const { data: activeGuests = [] } = useQuery({
    queryKey: ["bookings", "Checked-in"],
    queryFn: () => bookingService.getAll("Checked-in"),
  });

  const { data: completedStays = [] } = useQuery({
    queryKey: ["bookings", "Completed"],
    queryFn: () => bookingService.getAll("Completed"),
  });

  const noShowMutation = useMutation({
    mutationFn: (id: number) => bookingService.markNoShow(id),
    onSuccess: () => {
      toast.success("Booking marked as No-Show.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] }); // update room status
      setNoShowBooking(null);
    },
    onError: () => {
      toast.error("Failed to mark No-Show.");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (args: { id: number; data: Partial<BookingDto> }) => bookingService.update(args.id, args.data),
    onSuccess: () => {
      toast.success("Booking cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setCancelBooking(null);
    },
    onError: () => {
      toast.error("Failed to cancel booking.");
    }
  });

  const checkInMutation = useMutation({
    mutationFn: async (id: number) => bookingService.update(id, { status: "Checked-in" }),
    onSuccess: () => {
      toast.success("Guest checked in successfully.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => {
      toast.error("Failed to check in guest.");
    }
  });

  return (
    <AppShell
      title="Bookings"
      breadcrumbs={[{ label: "Home", to: "/" }, { label: "Bookings", to: "/bookings" }]}
    >
      <div className="flex flex-col h-[calc(100vh-130px)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-card">
              <TabsTrigger value="reservations" className="gap-2">
                Reservations
                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  {upcomingBookings.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2">
                Active Guests
                <span className="bg-emerald-500/20 text-emerald-500 text-xs px-2 py-0.5 rounded-full">
                  {activeGuests.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="cancellations">Cancellations & Refunds</TabsTrigger>
              <TabsTrigger value="noshows">No-Shows</TabsTrigger>
              <TabsTrigger value="completed">Completed Stays</TabsTrigger>
            </TabsList>
            {canAdd && <NewCheckInDrawer />}
          </div>

          <TabsContent value="reservations" className="flex-1 overflow-auto m-0 p-0">
            <ReservationsTab 
              bookings={upcomingBookings} 
              onCancel={setCancelBooking}
              onNoShow={setNoShowBooking}
              onCheckIn={(b) => checkInMutation.mutate(b.id)}
              canCheckIn={canEdit}
              canCancel={canDelete}
            />
          </TabsContent>
          <TabsContent value="active" className="flex-1 overflow-auto m-0 p-0">
            <ActiveGuestsTab bookings={activeGuests} />
          </TabsContent>
          <TabsContent value="cancellations" className="flex-1 overflow-auto m-0 p-0">
            <CancellationsTab />
          </TabsContent>
          <TabsContent value="noshows" className="flex-1 overflow-auto m-0 p-0">
            <NoShowsTab />
          </TabsContent>
          <TabsContent value="completed" className="flex-1 overflow-auto m-0 p-0">
            <CompletedStaysTab bookings={completedStays} currency={currency} />
          </TabsContent>
        </Tabs>
      </div>

      {/* No-Show Confirmation Dialog */}
      <Dialog open={!!noShowBooking} onOpenChange={(open) => !open && setNoShowBooking(null)}>
        <DialogContent className="max-w-md rounded-2xl glass">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Mark #{noShowBooking?.id} as No-Show</DialogTitle></DialogHeader>
          <div className="text-sm space-y-3">
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/30">
              <div className="text-xs text-muted-foreground">Advance held</div>
              <div className="font-serif text-2xl text-destructive">${noShowBooking?.advanceAmount}</div>
              <div className="text-xs text-muted-foreground mt-1">Per policy, advance is forfeited on no-show.</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setNoShowBooking(null)}>Back</Button>
              <Button 
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                disabled={noShowMutation.isPending}
                onClick={() => noShowBooking && noShowMutation.mutate(noShowBooking.id)}
              >
                {noShowMutation.isPending ? "Processing..." : "Confirm no-show"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelBooking} onOpenChange={(open) => !open && setCancelBooking(null)}>
        <DialogContent className="max-w-md rounded-2xl glass">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Cancel Booking #{cancelBooking?.id}</DialogTitle></DialogHeader>
          <div className="text-sm space-y-4">
            <div className="p-4 rounded-xl bg-muted/40">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Guest:</span> {cancelBooking?.guestName}</div>
                <div><span className="text-muted-foreground">Room:</span> {cancelBooking?.room?.number || "-"}</div>
                <div><span className="text-muted-foreground">Advance:</span> {currency}{cancelBooking?.advanceAmount}</div>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Cancellation Reason</label>
              <Textarea placeholder="Reason for cancellation..." className="rounded-xl" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setCancelBooking(null)}>Back</Button>
              <Button 
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                disabled={cancelMutation.isPending}
                onClick={() => cancelBooking && cancelMutation.mutate({ 
                  id: cancelBooking.id, 
                  data: { status: "Cancelled", refundAmount: cancelBooking.advanceAmount, refundMethod: "Original Payment Method", refundStatus: "Pending" } 
                })}
              >
                {cancelMutation.isPending ? "Processing..." : "Confirm cancellation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
