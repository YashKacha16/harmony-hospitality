import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { bookingService } from "@/api/services/bookingService";
import { settingsService } from "@/api/services/settingsService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Receipt, CheckCircle, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { printViaIframe } from "@/lib/utils";

interface Props {
  bookingId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "checkout" | "view";
}

export function CheckoutDrawer({ bookingId, open, onOpenChange, mode = "checkout" }: Props) {
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");

  const { data: bill, isLoading } = useQuery({
    queryKey: ['booking-bill', bookingId],
    queryFn: () => bookingId ? bookingService.getRoomBill(bookingId) : Promise.reject(),
    enabled: !!bookingId && open
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getGeneralSettings(),
  });

  const currencySymbol = settings?.currency?.match(/\((.*?)\)/)?.[1] || settings?.currency || "$";

  const checkoutMutation = useMutation({
    mutationFn: () => {
      if (!bookingId) return Promise.reject("No booking ID");
      return bookingService.checkout(bookingId, paymentMethod);
    },
    onSuccess: () => {
      toast.success("Checkout successful!");
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to checkout.");
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl flex items-center gap-2">
            <Receipt className="size-6 text-primary" /> {mode === "view" ? "Bill Overview" : "Checkout"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary size-8" />
            </div>
          ) : bill ? (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guest Name</span>
                  <span className="font-medium">{bill.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room</span>
                  <span className="font-medium">{bill.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stay</span>
                  <span className="font-medium">{new Date(bill.checkInDateTime).toLocaleDateString()} to {new Date(bill.checkOutDateTime).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billed Nights</span>
                  <span className="font-medium">{bill.billedNights}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Bill Breakdown</h3>
                <div className="flex justify-between items-center text-sm">
                  <span>Room Charges ({bill.billedNights} x {currencySymbol}{bill.roomPricePerNight})</span>
                  <span>{currencySymbol}{bill.totalRoomAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Restaurant & Room Service</span>
                  <span>{currencySymbol}{bill.totalRestaurantAmount.toFixed(2)}</span>
                </div>
                {bill.taxesAmount !== undefined && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Taxes ({bill.cgstPercent + bill.sgstPercent}%)</span>
                    <span>{currencySymbol}{bill.taxesAmount.toFixed(2)}</span>
                  </div>
                )}
                {bill.serviceChargeAmount !== undefined && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Service Charge ({bill.serviceChargePercent}%)</span>
                    <span>{currencySymbol}{bill.serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}
                {bill.restaurantOrders && bill.restaurantOrders.length > 0 && (
                  <div className="pl-4 text-xs text-muted-foreground space-y-1 mt-1 border-l-2 border-primary/20">
                    {bill.restaurantOrders.map((o: any) => (
                      <div key={o.id} className="flex flex-col space-y-1">
                        <div className="flex justify-between">
                          <span>Order {o.orderNumber}</span>
                          <span>{currencySymbol}{o.subtotal.toFixed(2)}</span>
                        </div>
                        {o.items && o.items.length > 0 && (
                          <div className="pl-3 space-y-0.5 border-l border-border/40 mt-1 mb-2">
                            {o.items.map((item: any, idx: number) => (
                              <div key={`${o.id}-item-${idx}`} className="flex justify-between text-[11px] text-muted-foreground/80">
                                <span>{item.name} x {item.quantity}</span>
                                <span>{currencySymbol}{(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="pt-3 border-t flex justify-between font-medium">
                  <span>Total Amount</span>
                  <span>{currencySymbol}{bill.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Advance Paid</span>
                  <span>-{currencySymbol}{bill.advanceAmount.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t flex justify-between text-xl font-bold text-primary">
                  <span>Amount Due</span>
                  <span>{currencySymbol}{bill.dueAmount.toFixed(2)}</span>
                </div>
              </div>

              {mode !== "view" && (
                <div className="space-y-2 pt-4">
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Debit Card">Debit Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline"
                  className={mode === "view" ? "w-full h-12 text-lg rounded-xl" : "w-1/3 h-12 text-lg rounded-xl"}
                  onClick={() => printViaIframe(`/print-booking/${bookingId}`)}
                >
                  <Printer className="size-5 mr-2" /> Print
                </Button>
                {mode !== "view" && (
                  <Button 
                    className="flex-1 h-12 text-lg rounded-xl" 
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending ? <Loader2 className="animate-spin size-5 mr-2" /> : <CheckCircle className="size-5 mr-2" />}
                    Confirm Checkout
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-destructive py-10">
              Failed to load bill information.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
