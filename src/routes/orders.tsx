import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { menuItems, orders as initOrders, type Order } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, Flag, ChefHat, Clock, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — Aurelia" }, { name: "description", content: "Dine-in, room service and parcel orders with a live kitchen board." }] }),
  component: OrdersPage,
});

const columns = ["New", "Preparing", "Ready", "Served"] as const;

function OrdersPage() {
  const [kds, setKds] = useState(false);
  const [source, setSource] = useState("Dine-in");
  const [cat, setCat] = useState("Starters");
  const [cart, setCart] = useState<{ name: string; qty: number; price: number }[]>([{ name: "Wagyu Ribeye", qty: 1, price: 62 }, { name: "Old Fashioned", qty: 2, price: 16 }]);

  const categories = Array.from(new Set(menuItems.map(m => m.category)));
  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <AppShell title={kds ? "Kitchen display" : "Orders"} breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Orders" }]}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Tabs value={source} onValueChange={setSource}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="Dine-in" className="rounded-lg">Dine-in</TabsTrigger>
            <TabsTrigger value="Room Service" className="rounded-lg">Room service</TabsTrigger>
            <TabsTrigger value="Parcel" className="rounded-lg">Parcel</TabsTrigger>
          </TabsList>
        </Tabs>
        <label className="flex items-center gap-2 text-sm"><Switch checked={kds} onCheckedChange={setKds} /> Kitchen display mode</label>
      </div>

      {!kds && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-4 mb-6">
          <Card className="p-5 rounded-2xl">
            <Tabs value={cat} onValueChange={setCat}>
              <TabsList className="rounded-xl flex-wrap h-auto">
                {categories.map(c => <TabsTrigger key={c} value={c} className="rounded-lg">{c}</TabsTrigger>)}
              </TabsList>
              {categories.map(c => (
                <TabsContent key={c} value={c} className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
                  {menuItems.filter(m => m.category === c).map(m => (
                    <Card key={m.id} className="p-0 rounded-xl overflow-hidden group">
                      <div className="h-24 overflow-hidden"><img src={m.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-medium leading-tight flex items-center gap-1.5">
                              <span className={cn("size-2 rounded-sm border", m.veg ? "border-success" : "border-destructive")}>
                                <span className={cn("block size-full rounded-[1px]", m.veg ? "bg-success" : "bg-destructive")} />
                              </span>
                              {m.name}
                            </div>
                            <div className="text-xs text-muted-foreground">${m.price}</div>
                          </div>
                          <Button size="sm" variant="ghost" className="size-7 p-0 rounded-lg" onClick={() => setCart(c => [...c, { name: m.name, qty: 1, price: m.price }])}><Plus className="size-4" /></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </Card>

          <Card className="p-5 rounded-2xl h-fit sticky top-24">
            <div className="font-serif text-xl">Cart · {source === "Dine-in" ? "Table 4+5" : source === "Room Service" ? "Room 305" : "PCL-202"}</div>
            <div className="text-xs text-muted-foreground mb-3">{cart.length} items</div>
            <div className="space-y-2 mb-3">
              {cart.map((i, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm border-b border-border pb-2">
                  <div className="flex-1">
                    <div>{i.name}</div>
                    <div className="text-xs text-muted-foreground">${i.price}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="size-6 rounded-md bg-muted" onClick={() => setCart(c => c.map((x, xi) => xi === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}><Minus className="size-3 mx-auto" /></button>
                    <span className="w-6 text-center">{i.qty}</span>
                    <button className="size-6 rounded-md bg-muted" onClick={() => setCart(c => c.map((x, xi) => xi === idx ? { ...x, qty: x.qty + 1 } : x))}><Plus className="size-3 mx-auto" /></button>
                  </div>
                </div>
              ))}
            </div>
            <Input placeholder="Special instructions…" className="rounded-xl mb-3" />
            <div className="flex justify-between text-sm mb-3"><span>Subtotal</span><span className="font-medium">${subtotal}</span></div>
            <Button className="w-full rounded-xl bg-primary text-primary-foreground copper-glow" onClick={() => toast.success("Order sent to kitchen")}><Send className="size-4 mr-1" /> Send to kitchen</Button>
          </Card>
        </div>
      )}

      <div className={cn("grid gap-4", kds ? "grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-4")}>
        {columns.map(col => {
          const items = initOrders.filter(o => o.status === col);
          return (
            <div key={col}>
              <div className="flex items-center justify-between mb-2">
                <div className={cn("font-serif tracking-widest uppercase", kds ? "text-lg" : "text-sm")}>{col}</div>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map(o => <OrderCard key={o.id} o={o} kds={kds} />)}
                {items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                    <ChefHat className="size-6 mx-auto opacity-50 mb-2" /> No {col.toLowerCase()} orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function OrderCard({ o, kds }: { o: Order; kds: boolean }) {
  return (
    <Card className={cn("rounded-2xl p-4", kds && "p-5 text-base", o.priority && "border-destructive/40")}>
      <div className="flex items-start justify-between">
        <div>
          <div className={cn("font-serif", kds ? "text-2xl" : "text-lg")}>{o.id}</div>
          <div className="text-xs text-muted-foreground">{o.source} · {o.ref}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={o.status} />
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="size-3" /> {o.elapsed}</span>
          {o.priority && <span className="flex items-center gap-1 text-[10px] text-destructive"><Flag className="size-3" /> priority</span>}
        </div>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        {o.items.map((i, idx) => (
          <div key={idx} className={cn("flex justify-between", i.cancelled && "line-through text-destructive")}>
            <span className="flex items-center gap-1.5">
              {i.qty}× {i.name}
              {i.addOn && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">Add-on</span>}
              {i.cancelled && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15">Cancelled</span>}
            </span>
            <span className="text-muted-foreground">${i.price}</span>
          </div>
        ))}
      </div>
      {kds ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="lg" variant="outline" className="rounded-xl">Start preparing</Button>
          <Button size="lg" className="rounded-xl bg-success text-white" onClick={() => toast.success(`${o.id} marked ready`)}>Mark ready</Button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="rounded-lg flex-1" onClick={() => toast("Editing order")}>Edit</Button>
          <Button size="sm" variant="ghost" className="rounded-lg text-destructive" onClick={() => toast.warning("Cancellation requires approval")}>Cancel</Button>
        </div>
      )}
    </Card>
  );
}
