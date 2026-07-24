import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { waitlist } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Plus, Users, Timer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/waitlist")({
  head: () => ({ meta: [{ title: "Waiting list — Aurelia" }, { name: "description", content: "Live queue for the restaurant with token numbers, wait times and instant notify." }] }),
  component: WaitPage,
});

function WaitPage() {
  return (
    <AppShell title="Waiting list" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Waitlist" }]}>
      <Card className="p-4 rounded-2xl mb-4 stat-gradient flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><Timer className="size-5" /></div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Estimated wait</div>
            <div className="font-serif text-2xl">~ 22 minutes</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground max-w-md">Based on average turnover of 48m over the last hour and 3 free tables.</div>
        <AddDialog />
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              <div className="font-medium">{w.name}</div>
              <div className="text-xs text-muted-foreground">{w.phone}</div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="size-3" /> Party {w.party}</span>
              <span>·</span>
              <span>{w.preference}</span>
              <span>·</span>
              <span className="text-primary">{w.waitedMin}m waiting</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => toast.success(`SMS sent to ${w.name}`)}><Bell className="size-3.5 mr-1" /> Notify</Button>
              <Button size="sm" className="rounded-lg bg-primary text-primary-foreground" onClick={() => toast.success(`${w.name} seated · removed from queue`)}>Assign table</Button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function AddDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild><Button className="rounded-xl bg-primary text-primary-foreground copper-glow"><Plus className="size-4 mr-1" /> Add to waitlist</Button></DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl glass">
        <DialogHeader><DialogTitle className="font-serif text-2xl">Add to waitlist</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast.success("Token A25 issued"); }}>
          <div><Label>Guest name</Label><Input className="rounded-xl mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input className="rounded-xl mt-1" /></div>
            <div><Label>Party size</Label><Input type="number" defaultValue={2} className="rounded-xl mt-1" /></div>
          </div>
          <div><Label>Seating preference</Label>
            <Select><SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="No preference" /></SelectTrigger>
              <SelectContent><SelectItem value="in">Indoor</SelectItem><SelectItem value="out">Outdoor</SelectItem><SelectItem value="ac">AC</SelectItem><SelectItem value="pv">Private</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Input placeholder="Anniversary" className="rounded-xl mt-1" /></div>
          <Button className="w-full rounded-xl bg-primary text-primary-foreground copper-glow">Issue token</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
