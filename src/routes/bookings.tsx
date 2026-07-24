import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { bookings, rooms, type Booking } from "@/lib/mock-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Phone, Mail, Utensils, Receipt, LogOut, ArrowLeftRight, Ban, AlertTriangle, Calendar, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Aurelia" }, { name: "description", content: "Reservations, check-ins, cancellations, refunds and no-shows in one flow." }] }),
  component: BookingsPage,
});

function BookingsPage() {
  const [cancel, setCancel] = useState<Booking | null>(null);
  const [noShow, setNoShow] = useState<Booking | null>(null);
  const reservations = bookings.filter(b => b.status === "Confirmed" || b.status === "No-Show Risk");
  const active = bookings.filter(b => b.status === "Checked-in");
  const cancelled = bookings.filter(b => b.status === "Cancelled");
  const noShows = bookings.filter(b => b.status === "No-Show");

  return (
    <AppShell title="Bookings" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Bookings" }]}>
      <Tabs defaultValue="reservations">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <TabsList className="rounded-xl">
            <TabsTrigger value="reservations" className="rounded-lg">Reservations <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">{reservations.length}</span></TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg">Active Guests <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-success/10 text-success text-[10px]">{active.length}</span></TabsTrigger>
            <TabsTrigger value="cancel" className="rounded-lg">Cancellations & Refunds</TabsTrigger>
            <TabsTrigger value="noshow" className="rounded-lg">No-Shows</TabsTrigger>
          </TabsList>
          <NewCheckInSheet />
        </div>

        <TabsContent value="reservations" className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <MiniCard label="Upcoming" value={reservations.length} tone="text-primary" />
            <MiniCard label="Arriving today" value={4} tone="text-info" />
            <MiniCard label="No-show risk" value={reservations.filter(r => r.status === "No-Show Risk").length} tone="[color:var(--warning)]" />
            <MiniCard label="Revenue booked" value="$28,412" tone="text-success" />
          </div>

          <Card className="rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div className="font-serif text-lg">Upcoming reservations</div>
              <Button variant="outline" size="sm" className="rounded-lg"><Calendar className="size-4 mr-1" /> Calendar view</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3">Booking</th><th className="px-4 py-3">Guest</th><th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Dates</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Advance</th>
                    <th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(b => (
                    <tr key={b.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{b.id}</td>
                      <td className="px-4 py-3">
                        <div>{b.guest}</div>
                        <div className="text-xs text-muted-foreground">{b.phone}</div>
                      </td>
                      <td className="px-4 py-3">Room {b.room}<div className="text-xs text-muted-foreground">{b.category}</div></td>
                      <td className="px-4 py-3">{b.checkIn} → {b.checkOut}<div className="text-xs text-muted-foreground">Arrival {b.checkInTime}</div></td>
                      <td className="px-4 py-3">{b.source}</td>
                      <td className="px-4 py-3">${b.advance.toFixed(0)}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          {b.status === "No-Show Risk" && <Button size="sm" variant="outline" className="rounded-lg [color:var(--warning)] border-warning/40" onClick={() => setNoShow(b)}><AlertTriangle className="size-3.5 mr-1" /> Mark No-Show</Button>}
                          <Button size="sm" variant="ghost" className="rounded-lg text-destructive" onClick={() => setCancel(b)}><Ban className="size-3.5 mr-1" /> Cancel</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map(b => (
            <Card key={b.id} className="p-5 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-serif text-lg">{b.guest}</div>
                  <div className="text-xs text-muted-foreground">Room {b.room} · {b.category}</div>
                </div>
                <StatusBadge status="Checked-in" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-muted-foreground">Check-out</div>{b.checkOut}</div>
                <div><div className="text-muted-foreground">Guests</div>{b.guests}</div>
                <div className="col-span-2 flex items-center gap-3 text-muted-foreground pt-1"><Phone className="size-3" /> {b.phone}</div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-1.5">
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => toast.success("Order started")}><Utensils className="size-3.5" /></Button>
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => toast("Opening bill")}><Receipt className="size-3.5" /></Button>
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => toast("Transfer room")}><ArrowLeftRight className="size-3.5" /></Button>
                <Button size="sm" className="rounded-lg bg-primary text-primary-foreground" onClick={() => toast.success(`${b.guest} checked out`)}><LogOut className="size-3.5" /></Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="cancel" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <MiniCard label="Refunded this month" value="$4,820" tone="text-success" />
            <MiniCard label="Pending refunds" value={cancelled.filter(c => c.refund?.status === "Pending").length} tone="[color:var(--warning)]" />
            <MiniCard label="Non-refundable" value={cancelled.filter(c => c.refund?.status === "Non-refundable").length} tone="text-destructive" />
          </div>
          <Card className="rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40"><tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Booking</th><th className="px-4 py-3">Guest</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Refund</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th>
              </tr></thead>
              <tbody>
                {cancelled.map(b => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{b.id}</td>
                    <td className="px-4 py-3">{b.guest}</td>
                    <td className="px-4 py-3">{b.checkIn} → {b.checkOut}</td>
                    <td className="px-4 py-3">${b.refund?.amount.toFixed(0)}</td>
                    <td className="px-4 py-3">{b.refund?.method}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.refund?.status ?? "Pending"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="noshow" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <MiniCard label="No-shows this month" value={noShows.length} tone="text-destructive" />
            <MiniCard label="Forfeited revenue" value="$1,240" tone="text-primary" />
            <MiniCard label="Avg no-show / week" value="1.8" tone="text-muted-foreground" />
          </div>
          <Card className="rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40"><tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Booking</th><th className="px-4 py-3">Guest</th><th className="px-4 py-3">Room</th><th className="px-4 py-3">Expected</th><th className="px-4 py-3">Forfeited</th>
              </tr></thead>
              <tbody>
                {noShows.map(b => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{b.id}</td>
                    <td className="px-4 py-3">{b.guest}</td>
                    <td className="px-4 py-3">Room {b.room}</td>
                    <td className="px-4 py-3">{b.checkIn} · {b.checkInTime}</td>
                    <td className="px-4 py-3 text-primary">${b.advance.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      <CancellationModal booking={cancel} onClose={() => setCancel(null)} />
      <NoShowModal booking={noShow} onClose={() => setNoShow(null)} />
    </AppShell>
  );
}

function MiniCard({ label, value, tone }: { label: string; value: any; tone?: string }) {
  return (
    <Card className="p-4 rounded-2xl">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("font-serif text-2xl mt-1", tone)}>{value}</div>
    </Card>
  );
}

function NewCheckInSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild><Button className="rounded-xl bg-primary text-primary-foreground copper-glow"><Plus className="size-4 mr-1" /> New check-in</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">New check-in</SheetTitle></SheetHeader>
        <form className="mt-6 space-y-4 px-4" onSubmit={(e) => { e.preventDefault(); toast.success("Check-in confirmed"); }}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Guest name</Label><Input className="rounded-xl mt-1" placeholder="Ava Sinclair" /></div>
            <div><Label>Phone</Label><Input className="rounded-xl mt-1" placeholder="+1 555…" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input className="rounded-xl mt-1" /></div>
            <div><Label>ID number</Label><Input className="rounded-xl mt-1" placeholder="P123456" /></div>
          </div>
          <div><Label>ID proof</Label><div className="mt-1 h-16 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs text-muted-foreground"><Upload className="size-4" /> Upload document</div></div>

          <div>
            <Label>Select room</Label>
            <div className="mt-2 grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {rooms.slice(0, 12).map(r => (
                <button key={r.id} type="button" className={cn("p-2 rounded-lg border text-left text-xs", r.status === "Available" ? "border-success/30 bg-success/5 hover:bg-success/10" : "border-border opacity-50 cursor-not-allowed")}>
                  <div className="font-medium">Room {r.number}</div>
                  <div className="text-[10px] text-muted-foreground">{r.category}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><Label>Check-in date</Label><Input type="date" className="rounded-xl mt-1" /></div>
            <div><Label>Check-in time</Label><Input type="time" className="rounded-xl mt-1" /></div>
            <div><Label>Check-out</Label><Input type="date" className="rounded-xl mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Guests</Label><Input type="number" defaultValue={2} className="rounded-xl mt-1" /></div>
            <div><Label>Advance</Label><Input placeholder="$0" className="rounded-xl mt-1" /></div>
            <div><Label>Method</Label>
              <Select><SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Card" /></SelectTrigger>
                <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full rounded-xl bg-primary text-primary-foreground copper-glow">Confirm check-in</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CancellationModal({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const [tier, setTier] = useState<0 | 1 | 2>(1);
  if (!booking) return null;
  const refundPct = [100, 50, 0][tier];
  const refund = (booking.advance * refundPct) / 100;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl glass">
        <DialogHeader><DialogTitle className="font-serif text-2xl">Cancel {booking.id}</DialogTitle></DialogHeader>
        <div className="text-sm space-y-3">
          <Card className="p-3 rounded-xl bg-muted/40">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Guest:</span> {booking.guest}</div>
              <div><span className="text-muted-foreground">Room:</span> {booking.room}</div>
              <div><span className="text-muted-foreground">Dates:</span> {booking.checkIn} → {booking.checkOut}</div>
              <div><span className="text-muted-foreground">Advance:</span> ${booking.advance.toFixed(0)}</div>
            </div>
          </Card>

          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Cancellation policy</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "7+ days", pct: "100%", tone: "success" },
                { l: "3–6 days", pct: "50%", tone: "warning" },
                { l: "< 48 hrs", pct: "0%", tone: "destructive" },
              ].map((t, i) => (
                <button key={i} onClick={() => setTier(i as 0 | 1 | 2)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition",
                    tier === i ? "ring-2 ring-primary" : "opacity-60",
                    t.tone === "success" && "bg-success/10 border-success/30",
                    t.tone === "warning" && "bg-warning/10 border-warning/30",
                    t.tone === "destructive" && "bg-destructive/10 border-destructive/30",
                  )}>
                  <div className="text-xs text-muted-foreground">{t.l}</div>
                  <div className="font-serif text-lg">{t.pct}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Reason</Label>
              <Select><SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Guest request" /></SelectTrigger>
                <SelectContent><SelectItem value="req">Guest request</SelectItem><SelectItem value="dup">Duplicate booking</SelectItem><SelectItem value="pay">Payment issue</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Refund amount</Label><Input defaultValue={`$${refund.toFixed(0)}`} className="rounded-xl mt-1" /></div>
          </div>
          <Textarea placeholder="Notes (required if overriding refund)…" className="rounded-xl" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Back</Button>
            <Button className="rounded-xl bg-destructive text-destructive-foreground" onClick={() => { toast.success(`Booking ${booking.id} cancelled — $${refund.toFixed(0)} refund queued`); onClose(); }}>Confirm cancellation</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NoShowModal({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  if (!booking) return null;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl glass">
        <DialogHeader><DialogTitle className="font-serif text-2xl">Mark {booking.id} as No-Show</DialogTitle></DialogHeader>
        <div className="text-sm space-y-3">
          <Card className="p-3 rounded-xl bg-destructive/5 border-destructive/30">
            <div className="text-xs text-muted-foreground">Advance held</div>
            <div className="font-serif text-2xl text-destructive">${booking.advance.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Per policy, advance is forfeited on no-show.</div>
          </Card>
          <Textarea placeholder="Reason / notes…" className="rounded-xl" />
          <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" /> Override — allow late check-in</label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Back</Button>
            <Button className="rounded-xl bg-destructive text-destructive-foreground" onClick={() => { toast.success(`${booking.id} marked no-show · Room ${booking.room} released`); onClose(); }}>Confirm no-show</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
