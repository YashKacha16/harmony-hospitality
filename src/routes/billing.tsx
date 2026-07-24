import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Send, Search, FileDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/billing")({
  head: () => ({ meta: [{ title: "Billing — Aurelia" }, { name: "description", content: "Room and restaurant invoices with tax breakdown, split bills and payment tracking." }] }),
  component: BillingPage,
});

function BillingPage() {
  return (
    <AppShell title="Billing" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Billing" }]}>
      <Tabs defaultValue="room">
        <TabsList className="rounded-xl mb-4">
          <TabsTrigger value="room" className="rounded-lg">Room bills</TabsTrigger>
          <TabsTrigger value="rest" className="rounded-lg">Restaurant bills</TabsTrigger>
        </TabsList>

        <TabsContent value="room" className="grid lg:grid-cols-[1fr_360px] gap-4">
          <Card className="p-6 rounded-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-serif text-2xl">Invoice BL-2201</div>
                <div className="text-xs text-muted-foreground">Ava Sinclair · Suite 501 · Nov 18 → Nov 22</div>
              </div>
              <StatusBadge status="Pending" />
            </div>
            <div className="border-t border-border">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                  <tr><th className="text-left py-2">Description</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Amount</th></tr>
                </thead>
                <tbody>
                  {[
                    ["Suite 501 · 4 nights", 4, 1280],
                    ["Room service · ORD-046", 1, 57],
                    ["Restaurant · ORD-049", 1, 102],
                    ["Laundry", 1, 24],
                    ["Minibar", 1, 32],
                  ].map(([d, q, a], i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2">{d}</td>
                      <td className="py-2 text-right">{q as number}</td>
                      <td className="py-2 text-right">${a as number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="w-64 text-sm space-y-1">
                <Row l="Subtotal" v="$1,495" />
                <Row l="Service charge (10%)" v="$149" />
                <Row l="CGST 9%" v="$134" />
                <Row l="SGST 9%" v="$134" />
                <Row l="Discount" v="-$50" tone="text-success" />
                <div className="border-t border-border pt-2 mt-2 flex justify-between font-serif text-lg"><span>Total due</span><span className="text-primary">$1,862</span></div>
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center gap-3 flex-wrap">
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-lg"><Printer className="size-4 mr-1" /> Print</Button>
                <Button variant="outline" className="rounded-lg"><Send className="size-4 mr-1" /> Send WhatsApp</Button>
                <Button variant="outline" className="rounded-lg"><Send className="size-4 mr-1" /> Send email</Button>
              </div>
              <div className="flex gap-2">
                <Select><SelectTrigger className="w-32 rounded-lg"><SelectValue placeholder="Card" /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
                </Select>
                <Button className="rounded-lg bg-primary text-primary-foreground copper-glow" onClick={() => toast.success("Bill generated & marked paid")}>Generate & mark paid</Button>
              </div>
            </div>
          </Card>

          <BillHistory />
        </TabsContent>

        <TabsContent value="rest">
          <Card className="p-6 rounded-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-serif text-2xl">Invoice BL-2202 · Split</div>
                <div className="text-xs text-muted-foreground">Table 4+5 · Party of 8 · Merged group</div>
              </div>
              <StatusBadge status="Paid" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Split A · T-4 (4 guests)", total: 218 },
                { title: "Split B · T-5 (4 guests)", total: 176 },
              ].map((s, i) => (
                <Card key={i} className="p-4 rounded-xl bg-muted/30">
                  <div className="font-medium">{s.title}</div>
                  <ul className="text-sm mt-2 space-y-1">
                    <li className="flex justify-between"><span>1× Wagyu Ribeye</span><span>$62</span></li>
                    <li className="flex justify-between"><span>2× Old Fashioned</span><span>$32</span></li>
                    <li className="flex justify-between"><span>1× Chef's Tasting</span><span>$120</span></li>
                    <li className="flex justify-between text-muted-foreground line-through"><span>2× Valrhona Fondant</span><span>Cancelled</span></li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-border flex justify-between font-medium"><span>Total</span><span className="text-primary">${s.total}</span></div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Row({ l, v, tone }: { l: string; v: string; tone?: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className={tone}>{v}</span></div>;
}

function BillHistory() {
  return (
    <Card className="p-4 rounded-2xl h-fit">
      <div className="flex items-center gap-2 mb-3">
        <div className="font-serif text-lg flex-1">Bill history</div>
        <Button size="sm" variant="ghost"><FileDown className="size-4" /></Button>
      </div>
      <div className="relative mb-3"><Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" /><Input className="pl-7 h-8 rounded-lg text-xs" placeholder="Search…" /></div>
      <div className="space-y-2 text-sm">
        {[
          ["BL-2200", "Noah Patel", "$980", "Paid"],
          ["BL-2199", "Sofia Reyes", "$412", "Paid"],
          ["BL-2198", "Kenji Ito", "$1,220", "Partial"],
          ["BL-2197", "Isabella Rossi", "$3,041", "Pending"],
          ["BL-2196", "Elena Costa", "$188", "Paid"],
        ].map(([id, g, a, s], i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
            <div>
              <div className="font-medium text-xs">{id}</div>
              <div className="text-[11px] text-muted-foreground">{g}</div>
            </div>
            <div className="text-right">
              <div className="font-medium">{a}</div>
              <StatusBadge status={s as string} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
