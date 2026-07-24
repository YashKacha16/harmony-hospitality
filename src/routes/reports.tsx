import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { revenueSeries, topItems } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Revenue — Aurelia" }, { name: "description", content: "Room and restaurant revenue, occupancy trends and top-selling items." }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell title="Reports & revenue" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Reports" }]}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Tabs defaultValue="month">
          <TabsList className="rounded-xl">
            <TabsTrigger value="today" className="rounded-lg">Today</TabsTrigger>
            <TabsTrigger value="week" className="rounded-lg">Week</TabsTrigger>
            <TabsTrigger value="month" className="rounded-lg">Month</TabsTrigger>
            <TabsTrigger value="custom" className="rounded-lg">Custom</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" className="rounded-xl"><FileDown className="size-4 mr-1" /> Export PDF/Excel</Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
        <Stat label="Total revenue" value="$142,820" delta="+12.4%" tone="text-primary" />
        <Stat label="Avg daily" value="$4,760" delta="+8.1%" />
        <Stat label="Total bookings" value="284" delta="+22" />
        <Stat label="Total orders" value="1,412" delta="+141" />
        <Stat label="Avg order value" value="$48" delta="+$3" />
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <Card className="p-4 rounded-2xl border-warning/30 bg-warning/5">
          <div className="text-xs uppercase tracking-widest [color:var(--warning)]">No-show forfeited</div>
          <div className="font-serif text-2xl mt-1">$1,240</div>
          <div className="text-xs text-muted-foreground">This month · 6 no-shows</div>
        </Card>
        <Card className="p-4 rounded-2xl border-info/30 bg-info/5">
          <div className="text-xs uppercase tracking-widest text-info">Refunds issued</div>
          <div className="font-serif text-2xl mt-1">$4,820</div>
          <div className="text-xs text-muted-foreground">14 refunds processed</div>
        </Card>
        <Card className="p-4 rounded-2xl border-destructive/30 bg-destructive/5">
          <div className="text-xs uppercase tracking-widest text-destructive">Cancelled orders</div>
          <div className="font-serif text-2xl mt-1">32</div>
          <div className="text-xs text-muted-foreground">2.2% of total</div>
        </Card>
      </div>

      <Tabs defaultValue="combined">
        <TabsList className="rounded-xl mb-4">
          <TabsTrigger value="room" className="rounded-lg">Room revenue</TabsTrigger>
          <TabsTrigger value="rest" className="rounded-lg">Restaurant revenue</TabsTrigger>
          <TabsTrigger value="combined" className="rounded-lg">Combined</TabsTrigger>
        </TabsList>
        <TabsContent value="combined" className="grid lg:grid-cols-3 gap-4">
          <Card className="p-6 rounded-2xl lg:col-span-2">
            <div className="font-serif text-xl mb-4">Revenue trend</div>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="ra" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="room" stroke="var(--primary)" strokeWidth={2} fill="url(#ra)" />
                  <Area type="monotone" dataKey="restaurant" stroke="var(--info)" strokeWidth={2} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl">
            <div className="font-serif text-xl mb-4">Top-selling items</div>
            <div className="space-y-3">
              {topItems.map((it, i) => (
                <div key={i} className="text-sm">
                  <div className="flex justify-between mb-1"><span>{it.name}</span><span className="text-muted-foreground">{it.sold}</span></div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(it.sold / 128) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 rounded-2xl lg:col-span-2">
            <div className="font-serif text-xl mb-4">Category-wise sales</div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { c: "Rooms", v: 82000 }, { c: "Starters", v: 12400 }, { c: "Mains", v: 24200 },
                  { c: "Beverages", v: 9800 }, { c: "Desserts", v: 6200 }, { c: "Specials", v: 8200 },
                ]}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="c" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Bar dataKey="v" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl">
            <div className="font-serif text-xl mb-4">Top room categories</div>
            <div className="space-y-3 text-sm">
              {[["Suite", 62], ["Executive", 41], ["Deluxe", 84], ["Standard", 97]].map(([n, v], i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1"><span>{n}</span><span className="text-muted-foreground">{v} nights</span></div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(v as number)}%`, background: "var(--info)" }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="room"><EmptyReport /></TabsContent>
        <TabsContent value="rest"><EmptyReport /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Stat({ label, value, delta, tone }: { label: string; value: string; delta: string; tone?: string }) {
  return (
    <Card className="p-4 rounded-2xl stat-gradient">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("font-serif text-2xl mt-1", tone)}>{value}</div>
      <div className="text-xs mt-1 text-success flex items-center gap-1"><TrendingUp className="size-3" /> {delta}</div>
    </Card>
  );
}

function EmptyReport() {
  return <Card className="p-12 rounded-2xl text-center text-muted-foreground text-sm">Filtered view — same charts scoped.</Card>;
}
