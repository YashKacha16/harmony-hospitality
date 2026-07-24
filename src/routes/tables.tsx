import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { tables as initTables } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Combine, Split, Plus, MousePointerClick } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/tables")({
  head: () => ({ meta: [{ title: "Tables — Aurelia" }, { name: "description", content: "Interactive restaurant floor plan with merge, split and zone management." }] }),
  component: TablesPage,
});

const statusColor: Record<string, string> = {
  Free: "bg-success/20 border-success text-success",
  Occupied: "bg-destructive/20 border-destructive text-destructive",
  Reserved: "bg-warning/20 border-warning [color:var(--warning)]",
  Cleaning: "bg-muted border-muted-foreground/30 text-muted-foreground",
  Merged: "bg-special/20 border-special [color:var(--special)]",
};

function TablesPage() {
  const [zone, setZone] = useState("All");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [side, setSide] = useState<string | null>(null);
  const tables = zone === "All" ? initTables : initTables.filter(t => t.zone === zone);

  const toggle = (id: string) => {
    if (!selectMode) { setSide(id); return; }
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const doMerge = () => {
    if (selected.length < 2) return toast.error("Select at least two tables");
    toast.success(`Tables merged into ${selected.map(id => initTables.find(t => t.id === id)?.number.replace("T-", "")).join("+")}`);
    setSelected([]); setSelectMode(false);
  };

  return (
    <AppShell title="Restaurant floor" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Tables" }]}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Tabs value={zone} onValueChange={setZone}>
          <TabsList className="rounded-xl">
            {["All", "Indoor", "Outdoor", "AC", "Private"].map(z => <TabsTrigger key={z} value={z} className="rounded-lg">{z}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button variant={selectMode ? "default" : "outline"} className="rounded-xl" onClick={() => { setSelectMode(!selectMode); setSelected([]); }}>
            <MousePointerClick className="size-4 mr-1" /> {selectMode ? "Selecting…" : "Select mode"}
          </Button>
          {selectMode && selected.length >= 2 && (
            <Button className="rounded-xl bg-special text-white" onClick={doMerge}><Combine className="size-4 mr-1" /> Merge {selected.length}</Button>
          )}
          <Button variant="outline" className="rounded-xl" onClick={() => toast("Add table dialog")}><Plus className="size-4 mr-1" /> Add table</Button>
        </div>
      </div>

      <Card className="rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-muted/40 to-background border-dashed" style={{ minHeight: 560 }}>
        {/* Floor grid */}
        <div className="absolute inset-6 rounded-xl border-2 border-dashed border-border" />
        {/* Merged group line */}
        <div className="absolute" style={{ left: `${62 + 6}%`, top: `${14 + 3}%`, width: "22%", height: "10%", border: "2px dashed var(--special)", borderRadius: 20, opacity: 0.5, pointerEvents: "none" }} />

        {tables.map(t => {
          const isSelected = selected.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={cn(
                "absolute flex flex-col items-center justify-center border-2 transition-all hover:scale-105",
                statusColor[t.status],
                t.shape === "round" ? "rounded-full" : "rounded-xl",
                isSelected && "ring-4 ring-primary ring-offset-2 ring-offset-background",
              )}
              style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.capacity <= 2 ? 72 : t.capacity <= 4 ? 88 : 108, height: t.capacity <= 2 ? 72 : t.capacity <= 4 ? 88 : 108 }}
            >
              <div className="font-serif text-lg leading-none">{t.number}</div>
              <div className="text-[10px] opacity-80 mt-1">{t.capacity} · {t.zone}</div>
              {t.mergedWith && <div className="text-[9px] mt-0.5 px-1.5 rounded-full bg-special/30">Merged</div>}
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          {Object.entries(statusColor).map(([k, cls]) => (
            <span key={k} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-full border", cls)} /> {k}</span>
          ))}
        </div>
      </Card>

      <Sheet open={!!side} onOpenChange={(o) => !o && setSide(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {side && (() => {
            const t = initTables.find(x => x.id === side)!;
            return (
              <>
                <SheetHeader><SheetTitle className="font-serif text-2xl">{t.number}{t.mergedWith ? ` + ${t.mergedWith.map(m => initTables.find(x => x.id === m)?.number).join(", ")}` : ""}</SheetTitle></SheetHeader>
                <div className="mt-6 space-y-4 px-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Card className="p-3 rounded-xl"><div className="text-xs text-muted-foreground">Capacity</div><div className="font-serif text-xl">{t.capacity}{t.mergedWith ? " + 4" : ""}</div></Card>
                    <Card className="p-3 rounded-xl"><div className="text-xs text-muted-foreground">Status</div><div className="font-serif text-xl">{t.status}</div></Card>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="rounded-xl bg-primary text-primary-foreground" onClick={() => toast.success("Guests seated")}>Seat guests</Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => toast.success("Order started")}>Start order</Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => toast("Reserved for 8pm")}>Reserve</Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => toast.success("Marked for cleaning")}>Needs cleaning</Button>
                  </div>
                  {t.mergedWith && (
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => toast.warning("Unmerge requires reassigning items")}>
                      <Split className="size-4 mr-1" /> Split / unmerge
                    </Button>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
