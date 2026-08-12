import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BedDouble, ClipboardList, Clock, Utensils, Sparkles,
  Plus, ListPlus, ShoppingBag, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

import { roomService } from "@/api/services/roomService";
import { waitlistService } from "@/api/services/waitlistService";
import { orderService } from "@/api/services/orderService";
import { tableService } from "@/api/services/tableService";
import { bookingService } from "@/api/services/bookingService";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Aurelia" }, { name: "description", content: "Property command center: occupancy, revenue, orders and alerts at a glance." }] }),
  component: Dashboard,
});

function Stat({ label, value, icon: Icon, accent }: any) {
  return (
    <Card className="p-5 stat-gradient border-border/60 rounded-2xl relative overflow-hidden group">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-serif text-3xl mt-1.5">{value}</div>
        </div>
        <div className={cn("size-10 rounded-xl flex items-center justify-center", accent)}>
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { data: rooms = [] } = useQuery({ queryKey: ["rooms"], queryFn: () => roomService.getAll() });
  const { data: waitlist = [] } = useQuery({ queryKey: ["waitlist"], queryFn: () => waitlistService.getAll() });
  const { data: tables = [] } = useQuery({ queryKey: ["tables"], queryFn: () => tableService.getAll() });
  const { data: bookings = [] } = useQuery({ queryKey: ["bookings"], queryFn: () => bookingService.getAll() });
  const { data: kanban = { new: [], preparing: [], ready: [], served: [] } as any } = useQuery({ 
    queryKey: ["kanbanOrders", "All"], 
    queryFn: () => orderService.getKanban("All") 
  });

  const availableRooms = rooms.filter(r => r.status === "Available" || r.status === "Clean").length;
  const occupiedRooms = rooms.filter(r => r.status === "Occupied").length;
  const totalRooms = rooms.length || 1;
  const occupancyPercent = rooms.length === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100);

  const waitingGuests = waitlist.filter(w => w.status === "Waiting").length;
  
  const occupiedTables = tables.filter(t => t.status === "Occupied").length;
  
  const activeOrders = (kanban.new?.length || 0) + (kanban.preparing?.length || 0) + (kanban.ready?.length || 0) + (kanban.served?.length || 0);

  // Additional dynamic stats
  const pendingNoShows = bookings.filter(b => b.status === "Pending" || b.status === "Confirmed").length;
  
  // Get recent active orders across all kanban boards
  const recentOrders = [
    ...(kanban.new || []),
    ...(kanban.preparing || []),
    ...(kanban.ready || []),
    ...(kanban.served || [])
  ]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 4);

  return (
    <AppShell breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]}>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-primary">Good morning, Admin</div>
          <h1 className="font-serif text-4xl mt-1">Property overview</h1>
          <p className="text-muted-foreground mt-1">A real-time snapshot of the property.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/bookings"><Button variant="outline" className="rounded-xl"><Plus className="size-4 mr-1" /> New Booking</Button></Link>
          <Link to="/waitlist"><Button variant="outline" className="rounded-xl"><ListPlus className="size-4 mr-1" /> Waitlist</Button></Link>
          <Link to="/orders" search={{ tableId: undefined, mergeGroupId: undefined, editOrderId: undefined, tab: undefined, roomNumber: undefined }}><Button className="rounded-xl bg-primary text-primary-foreground copper-glow"><ShoppingBag className="size-4 mr-1" /> New Order</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Stat label="Occupancy" value={`${occupancyPercent}%`} icon={BedDouble} accent="bg-info/15 text-info" />
        <Stat label="Active Orders" value={activeOrders} icon={ClipboardList} accent="bg-warning/15 [color:var(--warning)]" />
        <Stat label="Guests Waiting" value={waitingGuests} icon={Clock} accent="bg-special/15 [color:var(--special)]" />
        <Stat label="Rooms Available" value={availableRooms} icon={Sparkles} accent="bg-success/15 text-success" />
        <Stat label="Tables Occupied" value={`${occupiedTables}/${tables.length}`} icon={Utensils} accent="bg-destructive/15 text-destructive" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <div className="space-y-4 lg:col-span-1 lg:col-start-1">
          <Link to="/bookings" className="block">
            <Card className="p-5 rounded-2xl border-warning/40 bg-warning/5 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest [color:var(--warning)]">Pending Bookings</div>
                  <div className="font-serif text-3xl mt-1">{pendingNoShows}</div>
                  <div className="text-xs text-muted-foreground mt-1">Bookings awaiting check-in</div>
                </div>
                <AlertTriangle className="size-8 [color:var(--warning)]" />
              </div>
            </Card>
          </Link>
        </div>

        <Card className="p-6 rounded-2xl lg:col-span-2">
          <div className="font-serif text-xl mb-4">Live orders</div>
          {recentOrders.length === 0 ? (
             <div className="text-sm text-muted-foreground flex items-center justify-center h-32 border border-dashed rounded-xl border-white/10">No active orders at the moment.</div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                  <div>
                    <div className="font-medium">
                      {o.orderNumber || `ORD-${String(o.id).padStart(4, '0')}`} 
                      {o.tableName ? ` · Table ${o.tableName}` : o.roomNumber ? ` · Room ${o.roomNumber}` : o.customerName ? ` · ${o.customerName}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">{o.items?.length || 0} item{(o.items?.length || 0) === 1 ? "" : "s"} {o.type ? `· ${o.type}` : ""}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
