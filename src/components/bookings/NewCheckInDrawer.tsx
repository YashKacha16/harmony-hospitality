import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomService } from "@/api/services/roomService";
import { bookingService } from "@/api/services/bookingService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NewCheckInDrawer() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [roomId, setRoomId] = useState<number | null>(null);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState("2");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [idProofFile, setIdProofFile] = useState<File | null>(null);

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!roomId) throw new Error("Please select a room.");
      
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
          <Plus className="size-4 mr-1" /> New check-in
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">New check-in</SheetTitle></SheetHeader>
        <form 
          className="mt-6 space-y-4 px-4" 
          onSubmit={(e) => { 
            e.preventDefault(); 
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
              <Input required className="rounded-xl mt-1" placeholder="+1 555…" value={phone} onChange={e => setPhone(e.target.value)} />
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
              <Input required type="date" className="rounded-xl mt-1" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} />
            </div>
            <div>
              <Label>Check-in time</Label>
              <Input required type="time" className="rounded-xl mt-1" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} />
            </div>
            <div>
              <Label>Check-out</Label>
              <Input required type="date" className="rounded-xl mt-1" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Guests</Label>
              <Input type="number" className="rounded-xl mt-1" value={guests} onChange={e => setGuests(e.target.value)} />
            </div>
            <div>
              <Label>Advance</Label>
              <Input type="number" placeholder="0" className="rounded-xl mt-1" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} />
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
