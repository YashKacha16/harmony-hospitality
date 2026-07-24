import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { housekeeping, maintenanceRequests, employees } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Flag, Sparkles, ClipboardCheck, Clock, Wrench, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/housekeeping")({
  head: () => ({ meta: [{ title: "Housekeeping — Aurelia" }, { name: "description", content: "Daily cleaning workflow, room inspections and maintenance requests." }] }),
  component: HKPage,
});

const columns = ["Needs Cleaning", "Cleaning In Progress", "Inspection Pending", "Ready/Clean"] as const;
const colTone: Record<string, string> = {
  "Needs Cleaning": "border-warning/40 bg-warning/5",
  "Cleaning In Progress": "border-info/40 bg-info/5",
  "Inspection Pending": "border-special/40 bg-special/5",
  "Ready/Clean": "border-success/40 bg-success/5",
};

function HKPage() {
  return (
    <AppShell title="Housekeeping" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Housekeeping" }]}>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Sparkles} label="Needs cleaning" value={housekeeping.filter(h => h.column === "Needs Cleaning").length} tone="text-warning [color:var(--warning)]" />
        <Stat icon={Clock} label="In progress" value={housekeeping.filter(h => h.column === "Cleaning In Progress").length} tone="text-info" />
        <Stat icon={ClipboardCheck} label="Avg cleaning time" value="34m" tone="text-primary" />
        <Stat icon={Wrench} label="Open maintenance" value={maintenanceRequests.filter(m => m.status !== "Resolved").length} tone="text-destructive" />
      </div>

      <Tabs defaultValue="board">
        <TabsList className="rounded-xl mb-4">
          <TabsTrigger value="board" className="rounded-lg">Cleaning board</TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-lg">Maintenance</TabsTrigger>
          <TabsTrigger value="checklist" className="rounded-lg">Daily checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {columns.map(col => {
              const items = housekeeping.filter(h => h.column === col);
              return (
                <div key={col}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-serif text-sm uppercase tracking-widest">{col}</div>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <div className={cn("rounded-2xl border p-3 space-y-3 min-h-[400px]", colTone[col])}>
                    {items.map(h => (
                      <Card key={h.id} className="p-4 rounded-xl bg-card">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-serif text-lg">Room {h.room}</div>
                            <div className="text-xs text-muted-foreground">{h.category}</div>
                          </div>
                          {h.priority && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive"><Flag className="size-3" /> {h.priority}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">Last cleaned: {h.lastCleaned}</div>
                        <div className="mt-3">
                          <Select defaultValue={h.assignedTo}>
                            <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue placeholder="Assign staff" /></SelectTrigger>
                            <SelectContent>{employees.filter(e => e.role === "Housekeeping").map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-1.5 mt-3">
                          <Button size="sm" variant="outline" className="rounded-lg flex-1 text-xs" onClick={() => toast.success(`Room ${h.room} moved forward`)}>Advance</Button>
                          {col !== "Ready/Clean" && <Button size="sm" className="rounded-lg bg-primary text-primary-foreground text-xs" onClick={() => toast.success(`Room ${h.room} marked complete → Available`)}>Complete</Button>}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="flex justify-end mb-3"><Button className="rounded-xl bg-primary text-primary-foreground"><Plus className="size-4 mr-1" /> New request</Button></div>
          <Card className="rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">Room</th><th className="px-4 py-3">Issue</th><th className="px-4 py-3">Reported by</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceRequests.map(m => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">Room {m.room}</td>
                    <td className="px-4 py-3">{m.issue}</td>
                    <td className="px-4 py-3">{m.reportedBy}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card className="p-6 rounded-2xl">
            <div className="font-serif text-xl mb-1">Suite — daily cleaning checklist</div>
            <div className="text-sm text-muted-foreground mb-4">Default tasks per stay. Staff tick off as they go.</div>
            <div className="grid md:grid-cols-2 gap-2">
              {["Change linens & pillowcases", "Restock minibar", "Vacuum carpets & rugs", "Bathroom deep clean", "Restock amenities", "Wipe surfaces & mirrors", "Empty bins", "Refresh flowers", "Test remote & lights", "Log any damages"].map((t, i) => (
                <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30">
                  <Checkbox defaultChecked={i < 4} />
                  <span className={cn("text-sm", i < 4 && "line-through text-muted-foreground")}>{t}</span>
                </label>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  return (
    <Card className="p-4 rounded-2xl stat-gradient flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={cn("font-serif text-2xl mt-1", tone)}>{value}</div>
      </div>
      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="size-5 text-primary" /></div>
    </Card>
  );
}
