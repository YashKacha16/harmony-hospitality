import { useState, useRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/lib/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService, GeneralSettings } from "@/api/services/settingsService";
import { BASE_URL } from "@/api/apiClient";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Aurelia" }, { name: "description", content: "Property configuration: branding, taxes, cancellation tiers, notifications and theme." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.getGeneralSettings(),
    staleTime: 1000 * 60 * 5,
  });

  const [form, setForm] = useState<Partial<GeneralSettings>>({});

  // Initialize form when data loads
  if (settings && !form.name && !form.currency) {
    setForm({ ...settings });
  }

  const updateMutation = useMutation({
    mutationFn: (data: GeneralSettings) => settingsService.updateGeneralSettings(data),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(["settings"], updatedSettings);
      toast.success("Settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadLogo(file),
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, logoUrl: data.logoUrl }));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Logo uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload logo");
    },
  });

  const handleSave = () => {
    if (!form.name || !form.address || !form.email || !form.phone) {
      toast.error("Please fill in all required fields (Name, Address, Email, Phone)");
      return;
    }
    updateMutation.mutate(form as GeneralSettings);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadLogoMutation.mutate(e.target.files[0]);
    }
  };

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
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-muted rounded-xl"></div>
                <div className="h-20 bg-muted rounded-xl"></div>
                <div className="h-20 bg-muted rounded-xl"></div>
                <div className="h-10 bg-muted rounded-xl"></div>
              </div>
            ) : (
              <>
                <div>
                  <Label>Hotel / restaurant name</Label>
                  <Input 
                    value={form.name || ""} 
                    onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    className="rounded-xl mt-1" 
                  />
                </div>
                <div>
                  <Label>Logo</Label>
                  <div 
                    className="mt-1 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-xs gap-2 text-muted-foreground cursor-pointer hover:bg-muted/50 overflow-hidden relative"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {form.logoUrl ? (
                      <img src={`${BASE_URL}${form.logoUrl}`} alt="Logo" className="h-full object-contain" />
                    ) : (
                      <>
                        <Upload className="size-4" /> 
                        {uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea 
                    value={form.address || ""} 
                    onChange={e => setForm(f => ({...f, address: e.target.value}))}
                    className="rounded-xl mt-1" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone</Label>
                    <Input 
                      value={form.phone || ""} 
                      onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                      className="rounded-xl mt-1" 
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      value={form.email || ""} 
                      onChange={e => setForm(f => ({...f, email: e.target.value}))}
                      className="rounded-xl mt-1" 
                    />
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card className="p-6 rounded-2xl space-y-3">
            <div className="font-serif text-lg">Tax & currency</div>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-muted rounded-xl"></div>
                <div className="h-10 bg-muted rounded-xl"></div>
                <div className="h-10 bg-muted rounded-xl"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Currency</Label>
                    <Select 
                      value={form.currency || "INR (₹)"} 
                      onValueChange={(val) => setForm(prev => ({ ...prev, currency: val }))}
                    >
                      <SelectTrigger className="rounded-xl mt-1">
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR (₹)">INR (₹)</SelectItem>
                        <SelectItem value="USD ($)">USD ($)</SelectItem>
                        <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                        <SelectItem value="GBP (£)">GBP (£)</SelectItem>
                        <SelectItem value="AED (د.إ)">AED (د.إ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Service charge %</Label>
                    <Input 
                      type="number"
                      value={form.serviceChargePercent ?? 10} 
                      onChange={(e) => setForm(prev => ({ ...prev, serviceChargePercent: parseFloat(e.target.value) || 0 }))}
                      className="rounded-xl mt-1" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CGST %</Label>
                    <Input 
                      type="number"
                      value={form.cgstPercent ?? 9} 
                      onChange={(e) => setForm(prev => ({ ...prev, cgstPercent: parseFloat(e.target.value) || 0 }))}
                      className="rounded-xl mt-1" 
                    />
                  </div>
                  <div>
                    <Label>SGST %</Label>
                    <Input 
                      type="number"
                      value={form.sgstPercent ?? 9} 
                      onChange={(e) => setForm(prev => ({ ...prev, sgstPercent: parseFloat(e.target.value) || 0 }))}
                      className="rounded-xl mt-1" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <Label>Estimated wait time (minutes)</Label>
                    <Input 
                      type="number"
                      value={form.waitlistEstimatedWaitMinutes ?? 22} 
                      onChange={(e) => setForm(prev => ({ ...prev, waitlistEstimatedWaitMinutes: parseInt(e.target.value) || 0 }))}
                      className="rounded-xl mt-1" 
                    />
                  </div>
                  <div>
                    <Label>Minimum advance booking (%)</Label>
                    <Input 
                      type="number"
                      min={0}
                      max={100}
                      value={form.minimumAdvancePercent ?? 0} 
                      onChange={(e) => setForm(prev => ({ ...prev, minimumAdvancePercent: parseFloat(e.target.value) || 0 }))}
                      className="rounded-xl mt-1" 
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Waitlist descriptive message</Label>
                    <Textarea 
                      value={form.waitlistMessage ?? "Based on average turnover of 48m over the last hour and 3 free tables."} 
                      onChange={(e) => setForm(prev => ({ ...prev, waitlistMessage: e.target.value }))}
                      className="rounded-xl mt-1" 
                    />
                  </div>
                </div>
                <Button 
                  disabled={updateMutation.isPending}
                  className="rounded-xl bg-primary text-primary-foreground mt-4" 
                  onClick={handleSave}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
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
