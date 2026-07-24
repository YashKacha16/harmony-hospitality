import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revenueSeries, occupancyBreakdown, notifications, rooms, orders, waitlist } from "@/lib/mock-data";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, BedDouble, ClipboardList, Clock, Utensils, Wallet, Sparkles,
  Plus, UserPlus, ListPlus, ShoppingBag, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Aurelia" }, { name: "description", content: "Property command center: occupancy, revenue, orders and alerts at a glance." }] }),
  component: Dashboard,
});

function Stat({ label, value, delta, icon: Icon, series, trend = "up", accent }: any) {
  const positive = trend === "up";
  return (
    <Card className="p-5 stat-gradient border-border/60 rounded-2xl relative overflow-hidden group">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-serif text-3xl mt-1.5">{value}</div>
          <div className={cn("flex items-center gap-1 text-xs mt-1.5", positive ? "text-success" : "text-destructive")}>
            {positive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {delta} <span className="text-muted-foreground">vs last week</span>
          </div>
        </div>
        <div className={cn("size-10 rounded-xl flex items-center justify-center", accent)}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="h-10 mt-2 -mx-2 relative z-0">
        <ResponsiveContainer>
          <AreaChart data={series}>
            <defs>
              <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area dataKey="v" stroke="var(--primary)" strokeWidth={1.5} fill={`url(#g-${label})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const spark = (base: number) => Array.from({ length: 14 }, (_, i) => ({ v: base + Math.round(Math.sin(i / 1.5) * base * 0.15 + i * base * 0.02) }));

function Dashboard() {
  const [range, setRange] = useState("combined");
  return (
    <AppShell breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]}>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-primary">Good morning, Marcus</div>
          <h1 className="font-serif text-4xl mt-1">Property overview</h1>
          <p className="text-muted-foreground mt-1">A calm read on The Aurelia Grand — Friday, Nov 21.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl"><Plus className="size-4 mr-1" /> New Booking</Button>
          <Button variant="outline" className="rounded-xl"><UserPlus className="size-4 mr-1" /> Walk-in</Button>
          <Button variant="outline" className="rounded-xl"><ListPlus className="size-4 mr-1" /> Waitlist</Button>
          <Button className="rounded-xl bg-primary text-primary-foreground copper-glow"><ShoppingBag className="size-4 mr-1" /> New Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Stat label="Today's Revenue" value="$12,840" delta="+8.4%" trend="up" icon={Wallet} series={spark(12)} accent="bg-primary/15 text-primary" />
        <Stat label="Occupancy" value="78%" delta="+3.2%" trend="up" icon={BedDouble} series={spark(60)} accent="bg-info/15 text-info" />
        <Stat label="Active Orders" value="14" delta="+2" trend="up" icon={ClipboardList} series={spark(10)} accent="bg-warning/15 [color:var(--warning)]" />
        <Stat label="Guests Waiting" value="6" delta="-1" trend="down" icon={Clock} series={spark(4)} accent="bg-special/15 [color:var(--special)]" />
        <Stat label="Rooms Available" value="6" delta="+0" trend="up" icon={Sparkles} series={spark(5)} accent="bg-success/15 text-success" />
        <Stat label="Tables Occupied" value="8/12" delta="+1" trend="up" icon={Utensils} series={spark(7)} accent="bg-destructive/15 text-destructive" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-6 rounded-2xl lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="font-serif text-xl">Revenue trend</div>
              <div className="text-xs text-muted-foreground">Last 14 days</div>
            </div>
            <Tabs value={range} onValueChange={setRange}>
              <TabsList className="rounded-xl">
                <TabsTrigger value="room" className="rounded-lg">Room</TabsTrigger>
                <TabsTrigger value="restaurant" className="rounded-lg">Restaurant</TabsTrigger>
                <TabsTrigger value="combined" className="rounded-lg">Combined</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={revenueSeries} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="rev1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--info)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                {(range === "room" || range === "combined") && <Area type="monotone" dataKey="room" stroke="var(--primary)" strokeWidth={2} fill="url(#rev1)" />}
                {(range === "restaurant" || range === "combined") && <Area type="monotone" dataKey="restaurant" stroke="var(--info)" strokeWidth={2} fill="url(#rev2)" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <div className="font-serif text-xl">Occupancy split</div>
          <div className="text-xs text-muted-foreground mb-4">All 24 rooms</div>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={occupancyBreakdown} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {occupancyBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-6 rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-serif text-xl">Recent activity</div>
            <button className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowUpRight className="size-3" /></button>
          </div>
          <div className="space-y-3">
            {[
              { t: "Ava Sinclair checked in to Suite 501", time: "just now", tag: "Check-in", color: "bg-success/15 text-success" },
              { t: "Order #048 sent to kitchen — Table 9", time: "3m ago", tag: "Order", color: "bg-info/15 text-info" },
              { t: "Bill BL-2201 generated for Booking BK-1005", time: "8m ago", tag: "Billing", color: "bg-primary/15 text-primary" },
              { t: "Devlin Family added to waitlist (party 6)", time: "12m ago", tag: "Waitlist", color: "bg-special/15 [color:var(--special)]" },
              { t: "Booking BK-1008 marked as No-Show", time: "22m ago", tag: "No-show", color: "bg-destructive/15 text-destructive" },
              { t: "Room 204 checked out — cleaning queued", time: "34m ago", tag: "Housekeeping", color: "bg-warning/15 [color:var(--warning)]" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className={cn("text-[10px] uppercase tracking-widest px-2 py-1 rounded-full", r.color)}>{r.tag}</span>
                <div className="flex-1 text-sm">{r.t}</div>
                <div className="text-xs text-muted-foreground">{r.time}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Link to="/bookings">
            <Card className="p-5 rounded-2xl border-warning/40 bg-warning/5 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest [color:var(--warning)]">Pending No-Shows Today</div>
                  <div className="font-serif text-3xl mt-1">3</div>
                  <div className="text-xs text-muted-foreground mt-1">Bookings past expected check-in</div>
                </div>
                <AlertTriangle className="size-8 [color:var(--warning)]" />
              </div>
            </Card>
          </Link>
          <Link to="/housekeeping">
            <Card className="p-5 rounded-2xl border-info/40 bg-info/5 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-info">Rooms Awaiting Cleaning</div>
                  <div className="font-serif text-3xl mt-1">5</div>
                  <div className="text-xs text-muted-foreground mt-1">Housekeeping queue</div>
                </div>
                <Sparkles className="size-8 text-info" />
              </div>
            </Card>
          </Link>

          <Card className="p-5 rounded-2xl">
            <div className="font-serif text-lg mb-3">Live orders</div>
            <div className="space-y-2">
              {orders.slice(0, 4).map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <div>
                    <div className="font-medium">{o.id} · {o.ref}</div>
                    <div className="text-xs text-muted-foreground">{o.items.length} items · {o.elapsed}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
