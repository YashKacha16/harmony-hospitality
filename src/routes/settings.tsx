import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Aurelia" }, { name: "description", content: "Property configuration: branding, taxes, cancellation tiers, notifications and theme." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <AppShell title="Settings" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Settings" }]}>
      <Tabs defaultValue="general">
        <TabsList className="rounded-xl mb-4 flex-wrap h-auto">
          <TabsTrigger value="general" className="rounded-lg">General</TabsTrigger>
          <TabsTrigger value="policy" className="rounded-lg">Cancellation policy</TabsTrigger>
          <TabsTrigger value="notif" className="rounded-lg">Notifications</TabsTrigger>
          <TabsTrigger value="theme" className="rounded-lg">Appearance</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg">Roles & permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 rounded-2xl space-y-3">
            <div className="font-serif text-lg">Property</div>
            <div><Label>Hotel / restaurant name</Label><Input defaultValue="The Aurelia Grand" className="rounded-xl mt-1" /></div>
            <div><Label>Logo</Label><div className="mt-1 h-20 rounded-xl border-2 border-dashed flex items-center justify-center text-xs gap-2 text-muted-foreground"><Upload className="size-4" /> Upload</div></div>
            <div><Label>Address</Label><Textarea defaultValue="Rua da Prata 132, Lisbon, Portugal" className="rounded-xl mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input defaultValue="+351 21 123 4567" className="rounded-xl mt-1" /></div>
              <div><Label>Email</Label><Input defaultValue="stay@aurelia.co" className="rounded-xl mt-1" /></div>
            </div>
          </Card>
          <Card className="p-6 rounded-2xl space-y-3">
            <div className="font-serif text-lg">Tax & currency</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Currency</Label><Input defaultValue="USD ($)" className="rounded-xl mt-1" /></div>
              <div><Label>Service charge %</Label><Input defaultValue="10" className="rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CGST %</Label><Input defaultValue="9" className="rounded-xl mt-1" /></div>
              <div><Label>SGST %</Label><Input defaultValue="9" className="rounded-xl mt-1" /></div>
            </div>
            <Button className="rounded-xl bg-primary text-primary-foreground" onClick={() => toast.success("Settings saved")}>Save</Button>
          </Card>
        </TabsContent>

        <TabsContent value="policy">
          <Card className="p-6 rounded-2xl">
            <div className="font-serif text-lg mb-2">Cancellation tiers</div>
            <p className="text-sm text-muted-foreground mb-4">These rules appear in the Bookings cancellation flow.</p>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { l: "7+ days before check-in", pct: 100, tone: "border-success/40 bg-success/5" },
                { l: "3–6 days before", pct: 50, tone: "border-warning/40 bg-warning/5" },
                { l: "Within 48 hrs", pct: 0, tone: "border-destructive/40 bg-destructive/5" },
              ].map((t, i) => (
                <Card key={i} className={`p-4 rounded-xl ${t.tone}`}>
                  <div className="text-xs text-muted-foreground">{t.l}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Input defaultValue={t.pct} className="w-20 rounded-lg" />
                    <span className="text-sm text-muted-foreground">% refunded</span>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-4"><Button className="rounded-xl bg-primary text-primary-foreground" onClick={() => toast.success("Policy updated")}>Save policy</Button></div>
          </Card>
        </TabsContent>

        <TabsContent value="notif">
          <Card className="p-6 rounded-2xl space-y-3 max-w-lg">
            {["New booking email", "No-show alert", "Housekeeping updates", "Kitchen delays", "Daily revenue digest"].map(n => (
              <div key={n} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div className="text-sm">{n}</div>
                <Switch defaultChecked />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card className="p-6 rounded-2xl max-w-lg space-y-4">
            <div className="font-serif text-lg">Appearance</div>
            <RadioGroup value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")} className="grid grid-cols-3 gap-3">
              {[
                { v: "light", label: "Light" },
                { v: "dark", label: "Dark" },
                { v: "system", label: "System" },
              ].map(opt => (
                <label key={opt.v} className="rounded-xl border border-border p-4 cursor-pointer flex items-center gap-3 hover:border-primary/40">
                  <RadioGroupItem value={opt.v} /> {opt.label}
                </label>
              ))}
            </RadioGroup>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card className="p-12 rounded-2xl text-center">
            <div className="font-serif text-xl mb-2">Role permissions</div>
            <p className="text-sm text-muted-foreground">Granular role &amp; permission controls will live here.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
