import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomService } from "@/api/services/roomService";
import { bookingService } from "@/api/services/bookingService";
import { settingsService } from "@/api/services/settingsService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NewCheckInDrawer() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const todayStr = new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD format in local timezone

  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkInTime, setCheckInTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (open) {
      const now = new Date();
      setCheckInTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }
  }, [open]);

  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState("2");
  const [extraBeds, setExtraBeds] = useState("0");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [idProofFile, setIdProofFile] = useState<File | null>(null);

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomService.getAll(),
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.getGeneralSettings(),
  });

  const getNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const selectedRoom = rooms.find(r => r.id === roomId);
  const nights = getNights() || 1;
  const extraBedRate = settings?.extraBedPrice ?? 500;
  const parsedExtraBeds = parseInt(extraBeds) || 0;
  const extraBedCost = parsedExtraBeds * extraBedRate * nights;
  const totalPrice = (selectedRoom ? selectedRoom.basePrice * nights : 0) + extraBedCost;
  const minAdvancePercent = settings?.minimumAdvancePercent || 0;
  const minAdvanceAmount = Math.round(totalPrice * (minAdvancePercent / 100));

  useEffect(() => {
    if (minAdvanceAmount > 0) {
      setAdvanceAmount(minAdvanceAmount.toString());
    } else {
      setAdvanceAmount("");
    }
  }, [minAdvanceAmount]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!roomId) throw new Error("Please select a room.");

      const selectedRoom = rooms.find(r => r.id === roomId);
      if (selectedRoom) {
        const parsedGuests = parseInt(guests) || 0;
        if (parsedGuests > selectedRoom.capacity) {
          throw new Error(`The number of guests (${parsedGuests}) cannot exceed the room capacity (${selectedRoom.capacity}).`);
        }
      }

      if (minAdvanceAmount > 0) {
        const advanceNum = parseFloat(advanceAmount) || 0;
        if (advanceNum < minAdvanceAmount) {
          throw new Error(`Minimum advance amount of ${minAdvanceAmount} (${minAdvancePercent}% of total) is required.`);
        }
      }

      const formData = new FormData();
      formData.append("GuestName", guestName);
      formData.append("Phone", phone);
      formData.append("Email", email);
      formData.append("IdNumber", idNumber);
      formData.append("RoomId", roomId.toString());
      formData.append("CheckInDate", checkInDate);
      formData.append("CheckInTime", checkInTime);
      formData.append("CheckOutDate", checkOutDate);
      formData.append("Guests", guests);
      formData.append("ExtraBeds", extraBeds || "0");
      formData.append("AdvanceAmount", advanceAmount || "0");
      formData.append("PaymentMethod", paymentMethod);
      formData.append("Status", "Confirmed");
      formData.append("Source", "Walk-in");

      if (idProofFile) {
        formData.append("idProofFile", idProofFile);
      }

      return bookingService.create(formData);
    },
    onSuccess: () => {
      toast.success("Check-in confirmed");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setOpen(false);

      // Reset form
      setGuestName(""); setPhone(""); setEmail(""); setIdNumber("");
      setRoomId(null); setCheckInDate(""); setCheckOutDate(""); setAdvanceAmount("");
      setExtraBeds("0");
      setIdProofFile(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create booking");
    }
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="rounded-xl bg-primary text-primary-foreground copper-glow">
          <Plus className="size-4 mr-1" /> New Booking
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">New Booking</SheetTitle></SheetHeader>
        <form
          className="mt-6 space-y-4 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (phone.length !== 10) {
              toast.error("Phone number must be exactly 10 digits.");
              return;
            }
            if (checkInDate && checkInDate < todayStr) {
              toast.error("Check-in date cannot be in the past.");
              return;
            }
            if (checkOutDate && checkOutDate < checkInDate) {
              toast.error("Check-out date cannot be before the check-in date.");
              return;
            }
            if (!roomId) {
              toast.error("Please select a room.");
              return;
            }
            const selectedRoom = rooms.find(r => r.id === roomId);
            if (selectedRoom) {
              const parsedGuests = parseInt(guests) || 0;
              const parsedBeds = parseInt(extraBeds) || 0;
              if (parsedBeds > 2) {
                toast.error("Maximum 2 extra beds are allowed per room.");
                return;
              }
              const maxAllowed = selectedRoom.capacity + parsedBeds;
              if (parsedGuests > maxAllowed) {
                toast.error(`The number of guests (${parsedGuests}) cannot exceed room capacity (${selectedRoom.capacity}) plus extra beds (${parsedBeds}).`);
                return;
              }
            }
            if (minAdvanceAmount > 0) {
              const advanceNum = parseFloat(advanceAmount) || 0;
              if (advanceNum < minAdvanceAmount) {
                toast.error(`Minimum advance amount of ${minAdvanceAmount} (${minAdvancePercent}% of total) is required.`);
                return;
              }
            }
            createMutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Guest name</Label>
              <Input required className="rounded-xl mt-1" placeholder="Ava Sinclair" value={guestName} onChange={e => setGuestName(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                required
                type="tel"
                className="rounded-xl mt-1"
                placeholder="10-digit phone number"
                value={phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) {
                    setPhone(val);
                  }
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" className="rounded-xl mt-1" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>ID number</Label>
              <Input required className="rounded-xl mt-1" placeholder="P123456" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>ID proof</Label>
            <div className="mt-1 relative h-16 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs text-muted-foreground overflow-hidden">
              <input
                type="file"
                accept="image/*,.pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setIdProofFile(e.target.files[0]);
                  }
                }}
              />
              <Upload className="size-4" />
              {idProofFile ? idProofFile.name : "Upload document"}
            </div>
          </div>

          <div>
            <Label>Select room</Label>
            <div className="mt-2 grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {rooms.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { if (r.status === "Available") setRoomId(r.id); }}
                  className={cn(
                    "p-2 rounded-lg border text-left text-xs transition-colors",
                    r.status === "Available"
                      ? roomId === r.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-success/30 bg-success/5 hover:bg-success/10 cursor-pointer"
                      : "border-border opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="font-medium">Room {r.number}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{r.category?.name || "Cat"}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Check-in date</Label>
              <Input
                required
                type="date"
                className="rounded-xl mt-1"
                min={todayStr}
                value={checkInDate}
                onChange={e => setCheckInDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Check-in time</Label>
              <Input required type="time" className="rounded-xl mt-1" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} />
            </div>
            <div>
              <Label>Check-out</Label>
              <Input
                required
                type="date"
                className="rounded-xl mt-1"
                min={checkInDate || todayStr}
                value={checkOutDate}
                onChange={e => setCheckOutDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Guests</Label>
              <Input type="number" className="rounded-xl mt-1" value={guests} onChange={e => setGuests(e.target.value)} />
            </div>
            <div>
              <Label>Extra beds</Label>
              <Input type="number" min={0} max={2} className="rounded-xl mt-1" value={extraBeds} onChange={e => setExtraBeds(e.target.value)} />
            </div>
            <div>
              <Label>Advance {minAdvancePercent > 0 ? `(${minAdvancePercent}%)` : ""}</Label>
              <Input
                type="number"
                placeholder={minAdvanceAmount > 0 ? `${minAdvanceAmount}` : "0"}
                className="rounded-xl mt-1"
                value={advanceAmount}
                onChange={e => setAdvanceAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Card" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {minAdvancePercent > 0 && totalPrice > 0 && (
            <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl space-y-1">
              <div>Total room price for {nights} nights is <strong>{settings?.currency || 'INR'} {totalPrice}</strong>.</div>
              <div>Minimum advance required: <strong className="text-primary">{settings?.currency || 'INR'} {minAdvanceAmount}</strong> ({minAdvancePercent}%).</div>
            </div>
          )}

          <Button
            disabled={createMutation.isPending}
            className="w-full rounded-xl bg-primary text-primary-foreground copper-glow"
          >
            {createMutation.isPending ? "Confirming..." : "Confirm check-in"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
