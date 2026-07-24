import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { rooms, type Room } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LayoutGrid, List, Plus, MoreHorizontal, Upload, Users, Bed } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/rooms")({
  head: () => ({ meta: [{ title: "Rooms — Aurelia" }, { name: "description", content: "Inventory, live status and categories for every room in the property." }] }),
  component: RoomsPage,
});

function RoomsPage() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [status, setStatus] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const [detail, setDetail] = useState<Room | null>(null);

  const filtered = rooms.filter(r => (status === "all" || r.status === status) && (cat === "all" || r.category === cat));

  return (
    <AppShell title="Rooms" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Rooms" }]}>
      <Tabs defaultValue="inventory">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <TabsList className="rounded-xl">
            <TabsTrigger value="inventory" className="rounded-lg">Inventory</TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg">Categories & Pricing</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 items-center">
            <div className="rounded-xl bg-muted p-1 flex">
              <button onClick={() => setView("grid")} className={`p-1.5 rounded-lg ${view === "grid" ? "bg-background shadow-sm" : ""}`}><LayoutGrid className="size-4" /></button>
              <button onClick={() => setView("table")} className={`p-1.5 rounded-lg ${view === "table" ? "bg-background shadow-sm" : ""}`}><List className="size-4" /></button>
            </div>
            <AddRoomSheet />
          </div>
        </div>

        <TabsContent value="inventory">
          <Card className="p-4 rounded-2xl mb-4">
            <div className="flex gap-3 flex-wrap">
              <Input placeholder="Search room number or guest…" className="max-w-xs rounded-xl" />
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Deluxe">Deluxe</SelectItem>
                  <SelectItem value="Suite">Suite</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-44 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  {["Available", "Occupied", "Reserved", "Cleaning", "Maintenance", "Awaiting Inspection"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Min price" className="w-28 rounded-xl" />
              <Input placeholder="Max price" className="w-28 rounded-xl" />
              <Select><SelectTrigger className="w-32 rounded-xl"><SelectValue placeholder="Capacity" /></SelectTrigger><SelectContent><SelectItem value="1">1+</SelectItem><SelectItem value="2">2+</SelectItem><SelectItem value="4">4+</SelectItem></SelectContent></Select>
            </div>
          </Card>

          {view === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(r => (
                <Card key={r.id} className="rounded-2xl overflow-hidden group hover:shadow-lg transition p-0">
                  <div className="relative h-40 overflow-hidden">
                    <img src={r.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3"><StatusBadge status={r.status} /></div>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-white text-[11px]">{r.category}</div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-baseline justify-between">
                      <div className="font-serif text-xl">Room {r.number}</div>
                      <div className="text-primary font-medium">${r.price}<span className="text-xs text-muted-foreground">/night</span></div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Bed className="size-3.5" /> Floor {r.floor}</span>
                      <span className="flex items-center gap-1"><Users className="size-3.5" /> {r.capacity}</span>
                    </div>
                    {r.guest && <div className="text-xs mt-2 text-muted-foreground">Guest: <span className="text-foreground">{r.guest}</span> · out {r.checkOut}</div>}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={() => setDetail(r)}>View</Button>
                      <Select onValueChange={(v) => toast.success(`Room ${r.number} → ${v}`)}>
                        <SelectTrigger className="w-32 h-8 rounded-lg text-xs"><SelectValue placeholder="Change" /></SelectTrigger>
                        <SelectContent>{["Available", "Occupied", "Reserved", "Cleaning", "Maintenance", "Awaiting Inspection"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="px-4 py-3">Room</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Floor</th>
                      <th className="px-4 py-3">Capacity</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Guest</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">Room {r.number}</td>
                        <td className="px-4 py-3">{r.category}</td>
                        <td className="px-4 py-3">{r.floor}</td>
                        <td className="px-4 py-3">{r.capacity}</td>
                        <td className="px-4 py-3">${r.price}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{r.guest ?? "—"}</td>
                        <td className="px-4 py-3"><Button size="sm" variant="ghost" onClick={() => setDetail(r)}><MoreHorizontal className="size-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid md:grid-cols-2 gap-4">
            {(["Standard", "Deluxe", "Suite", "Executive"] as const).map(c => (
              <Card key={c} className="p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="font-serif text-xl">{c}</div>
                  <StatusBadge status="Active" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Base price</div><div className="font-medium">${{ Standard: 120, Deluxe: 190, Suite: 320, Executive: 480 }[c]}/night</div></div>
                  <div><div className="text-xs text-muted-foreground">Seasonal pricing</div><div className="font-medium flex items-center gap-2">Enabled <span className="size-2 rounded-full bg-success" /></div></div>
                </div>
                <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" className="rounded-lg">Edit</Button><Button size="sm" variant="ghost" className="rounded-lg">Seasonal rules</Button></div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl rounded-2xl glass">
          {detail && (
            <>
              <DialogHeader><DialogTitle className="font-serif text-2xl">Room {detail.number} · {detail.category}</DialogTitle></DialogHeader>
              <img src={detail.image} className="w-full h-56 object-cover rounded-xl" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-xs text-muted-foreground">Status</div><StatusBadge status={detail.status} /></div>
                <div><div className="text-xs text-muted-foreground">Price</div>${detail.price}/night</div>
                <div><div className="text-xs text-muted-foreground">Capacity</div>{detail.capacity} guests</div>
                <div><div className="text-xs text-muted-foreground">Floor</div>{detail.floor}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Amenities</div>
                <div className="flex flex-wrap gap-1.5">{detail.amenities.map(a => <span key={a} className="px-2 py-0.5 rounded-full bg-muted text-xs">{a}</span>)}</div>
              </div>
              {detail.guest && (
                <div className="border-t border-border pt-3">
                  <div className="text-xs text-muted-foreground">Current guest</div>
                  <div className="font-medium">{detail.guest}</div>
                  <div className="text-xs text-muted-foreground">Check-out: {detail.checkOut}</div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function AddRoomSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild><Button className="rounded-xl bg-primary text-primary-foreground copper-glow"><Plus className="size-4 mr-1" /> Add room</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">New room</SheetTitle><SheetDescription>Add a room to the inventory.</SheetDescription></SheetHeader>
        <form className="space-y-4 mt-6 px-4" onSubmit={(e) => { e.preventDefault(); toast.success("Room created"); }}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Room number</Label><Input placeholder="308" className="rounded-xl mt-1" /></div>
            <div><Label>Floor</Label><Input placeholder="3" className="rounded-xl mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <Select><SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="Standard">Standard</SelectItem><SelectItem value="Deluxe">Deluxe</SelectItem><SelectItem value="Suite">Suite</SelectItem><SelectItem value="Executive">Executive</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Capacity</Label><Input placeholder="2" className="rounded-xl mt-1" /></div>
          </div>
          <div><Label>Price / night</Label><Input placeholder="$220" className="rounded-xl mt-1" /></div>
          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {["WiFi", "AC", "TV", "Balcony", "Minibar", "Bathtub"].map(a => (
                <label key={a} className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> {a}</label>
              ))}
            </div>
          </div>
          <div>
            <Label>Image</Label>
            <div className="mt-1 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground gap-2"><Upload className="size-4" /> Drop image here</div>
          </div>
          <div><Label>Description</Label><Textarea placeholder="Notes about the room…" className="rounded-xl mt-1" /></div>
          <Button className="w-full rounded-xl bg-primary text-primary-foreground copper-glow">Create room</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
