import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { waitlist } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Plus, Users, Timer, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tableService } from "@/api/services/tableService";
import { waitlistService } from "@/api/services/waitlistService";
import { settingsService } from "@/api/services/settingsService";

export const Route = createFileRoute("/waitlist")({
  head: () => ({ meta: [{ title: "Waiting list — Aurelia" }, { name: "description", content: "Live queue for the restaurant with token numbers, wait times and instant notify." }] }),
  component: WaitPage,
});

function WaitPage() {
  const queryClient = useQueryClient();

  const { data: waitlist = [], isFetching } = useQuery({
    queryKey: ["waitlist"],
    queryFn: () => waitlistService.getAll()
  });

  const { data: settings } = useQuery({
    queryKey: ["settings", "general"],
    queryFn: () => settingsService.getGeneralSettings()
  });

  const notifyMutation = useMutation({
    mutationFn: (id: number) => waitlistService.updateStatus(id, 1), // 1 = Notified
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      toast.success(`SMS sent to ${data.guestName}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to notify guest");
    }
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, tableId }: { id: number, tableId: number }) => waitlistService.assignTable(id, tableId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["kanbanOrders"] });
      toast.success(`${data.guestName} seated to table!`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign table");
    }
  });

  return (
    <AppShell title="Waiting list" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Waitlist" }]}>
      <Card className="p-4 rounded-2xl mb-4 stat-gradient flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><Timer className="size-5" /></div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Estimated wait</div>
            <div className="font-serif text-2xl">~ {settings?.waitlistEstimatedWaitMinutes ?? 22} minutes</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground max-w-md">{settings?.waitlistMessage || "Based on average turnover of 48m over the last hour and 3 free tables."}</div>
        <AddDialog />
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isFetching && waitlist.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground animate-pulse flex items-center justify-center gap-2">
            <Loader2 className="size-5 animate-spin" /> Loading waitlist...
          </div>
        )}
        {waitlist.length === 0 && !isFetching && (
          <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border/50 rounded-2xl glass">
            No guests currently on the waitlist.
          </div>
        )}
        {waitlist.map(w => (
          <Card key={w.id} className="p-5 rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Token</div>
                <div className="font-serif text-4xl text-primary">{w.token}</div>
              </div>
              <StatusBadge status={w.status} />
            </div>
            <div className="mt-3">
              <div className="font-medium">{w.guestName}</div>
              <div className="text-xs text-muted-foreground">{w.phone}</div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="size-3" /> Party {w.partySize}</span>
              <span>·</span>
              <span>{w.seatingPreference}</span>
              <span>·</span>
              <span className="text-primary">{w.waitedMin}m waiting</span>
            </div>
            {w.notes && (
              <div className="mt-2 text-xs text-muted-foreground bg-muted/20 p-2 rounded-lg">
                Note: {w.notes}
              </div>
            )}
            <div className="mt-4">
              <AssignTableDialog waitlistEntry={w} assignMutation={assignMutation} />
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function AddDialog() {
  const [open, setOpen] = useState(false);
  const [partySize, setPartySize] = useState<number>(2);
  const [seating, setSeating] = useState<string>("No preference");
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  // Debounce state
  const [debouncedPartySize, setDebouncedPartySize] = useState(partySize);
  const [debouncedSeating, setDebouncedSeating] = useState(seating);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPartySize(partySize);
      setDebouncedSeating(seating);
    }, 400);
    return () => clearTimeout(timer);
  }, [partySize, seating]);

  const { data: availableTables, isFetching } = useQuery({
    queryKey: ["availableTables", debouncedPartySize, debouncedSeating],
    queryFn: () => tableService.getAvailable(debouncedPartySize, debouncedSeating),
    enabled: debouncedPartySize > 0 && open
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["tableCategories"],
    queryFn: () => tableService.getTableCategories(),
    enabled: open
  });

  const assignMutation = useMutation({
    mutationFn: (tableId: number) => tableService.assignTable(tableId, { guestName, phone, partySize, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success(`${guestName || "Guest"} seated directly to table!`);
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign table");
    }
  });

  const bestTable = availableTables && availableTables.length > 0 ? availableTables[0] : null;

  const createMutation = useMutation({
    mutationFn: () => waitlistService.create({ guestName, phone, partySize, seatingPreference: seating, notes }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      toast.success(`Token ${data.token} issued successfully`);
      setOpen(false);
      setGuestName("");
      setPhone("");
      setNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create waitlist entry");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-xl bg-primary text-primary-foreground copper-glow"><Plus className="size-4 mr-1" /> Add to waitlist</Button></DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl glass">
        <DialogHeader><DialogTitle className="font-serif text-2xl">Add to waitlist</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div><Label>Guest name</Label><Input required className="rounded-xl mt-1" value={guestName} onChange={e => setGuestName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input className="rounded-xl mt-1" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><Label>Party size</Label><Input type="number" min={1} value={partySize} onChange={e => setPartySize(parseInt(e.target.value) || 1)} className="rounded-xl mt-1" /></div>
          </div>
          <div><Label>Seating preference</Label>
            <Select value={seating} onValueChange={setSeating}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="No preference" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="No preference">No preference</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Input placeholder="Anniversary" className="rounded-xl mt-1" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          
          {isFetching ? (
            <div className="p-3 bg-muted/30 rounded-xl flex items-center justify-center text-sm text-muted-foreground animate-pulse">
              <Loader2 className="size-4 mr-2 animate-spin" /> Checking availability...
            </div>
          ) : bestTable ? (
            <div className="p-3 bg-success/15 border border-success/30 rounded-xl flex items-start gap-3">
              <CheckCircle className="size-5 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-success-foreground">Table {bestTable.name} (seats {bestTable.capacity}) is available now for your party of {partySize} ({bestTable.categoryName || 'General'}) — no need to wait.</p>
                <div className="mt-3 flex gap-2">
                  <Button type="button" className="flex-1 rounded-xl bg-success text-white hover:bg-success/90 font-bold shadow-md" onClick={() => assignMutation.mutate(bestTable.id)} disabled={assignMutation.isPending}>
                    {assignMutation.isPending ? "Assigning..." : "Seat now"}
                  </Button>
                  <Button type="submit" variant="outline" className="flex-1 rounded-xl border-success/30 text-success hover:bg-success/10 font-bold" disabled={assignMutation.isPending}>
                    Waitlist instead
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button type="submit" disabled={createMutation.isPending} className="w-full rounded-xl bg-primary text-primary-foreground copper-glow font-bold pt-1.5">
              {createMutation.isPending ? "Issuing..." : "Issue token"}
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignTableDialog({ waitlistEntry, assignMutation }: { waitlistEntry: any, assignMutation: any }) {
  const [open, setOpen] = useState(false);

  const { data: availableTables = [], isFetching } = useQuery({
    queryKey: ["availableTables", waitlistEntry.partySize, waitlistEntry.seatingPreference],
    queryFn: () => tableService.getAvailable(waitlistEntry.partySize, waitlistEntry.seatingPreference),
    enabled: open
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full rounded-lg bg-primary text-primary-foreground">Assign table</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl glass">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Assign Table</DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-muted-foreground mb-4">
          Assigning table for {waitlistEntry.guestName} (Party of {waitlistEntry.partySize})
        </div>

        {isFetching ? (
          <div className="p-3 bg-muted/30 rounded-xl flex items-center justify-center text-sm text-muted-foreground animate-pulse">
            <Loader2 className="size-4 mr-2 animate-spin" /> Checking availability...
          </div>
        ) : availableTables.length === 0 ? (
          <div className="p-4 text-center border border-dashed rounded-xl">
            <p className="text-muted-foreground">No free tables found for {waitlistEntry.partySize} guests.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {availableTables.map((table: any) => (
              <div key={table.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                <div>
                  <div className="font-medium">Table {table.name}</div>
                  <div className="text-xs text-muted-foreground">Seats {table.capacity} · {table.categoryName || 'General'}</div>
                </div>
                <Button 
                  size="sm" 
                  className="rounded-lg"
                  disabled={assignMutation.isPending}
                  onClick={() => {
                    assignMutation.mutate({ id: waitlistEntry.id, tableId: table.id }, {
                      onSuccess: () => setOpen(false)
                    });
                  }}
                >
                  Seat here
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
