import { useState, useRef, useEffect } from "react";
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
import { Upload, Shield, Lock, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { permissionService, RoleConfig, RolePermissions, PagePermission } from "@/lib/permissionService";
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

  // Roles State (fetch from backend)
  const { data: roles = [], refetch: refetchRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => permissionService.getRoles()
  });

  const [selectedRole, setSelectedRole] = useState("Admin");
  const [editingPermissions, setEditingPermissions] = useState<RolePermissions | null>(null);
  
  // Dialog State
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  // Sync editing permissions when selected role changes
  useEffect(() => {
    const roleConfig = roles.find(r => r.name.toLowerCase() === selectedRole.toLowerCase());
    if (roleConfig) {
      setEditingPermissions(JSON.parse(JSON.stringify(roleConfig.permissions)));
    }
  }, [selectedRole, roles]);

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


        <TabsContent value="roles">
          <div className="grid md:grid-cols-[250px_1fr] gap-6 items-start">
            {/* Left sidebar: list of roles */}
            <Card className="p-4 rounded-2xl border border-border/40 bg-sidebar/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-foreground">Roles</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="size-8 p-0 rounded-lg"
                  onClick={() => setIsAddRoleOpen(true)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {roles.map((r) => (
                  <div
                    key={r.name}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                      selectedRole.toLowerCase() === r.name.toLowerCase()
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setSelectedRole(r.name)}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="size-4" />
                      <span>{r.name}</span>
                    </div>
                    {!r.isSystem && (
                      <button
                        className={`size-6 rounded-md flex items-center justify-center transition-colors ${
                          selectedRole.toLowerCase() === r.name.toLowerCase()
                            ? "hover:bg-primary-foreground/15 text-primary-foreground"
                            : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete the role "${r.name}"?`)) {
                            permissionService.deleteRole(r.name).then(() => {
                              refetchRoles();
                              if (selectedRole === r.name) {
                                setSelectedRole("Admin");
                              }
                              toast.success(`Role "${r.name}" deleted successfully.`);
                            }).catch(() => {
                              toast.error(`Failed to delete role "${r.name}".`);
                            });
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                    {r.isSystem && <Lock className="size-3.5 opacity-40" />}
                  </div>
                ))}
              </div>
            </Card>

            {/* Right panel: permissions matrix */}
            <Card className="p-6 rounded-2xl border border-border/40 bg-sidebar/20 space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                  <Shield className="size-5 text-primary" />
                  Permissions for {selectedRole}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Configure module access and dynamic actions for this user role.</p>
              </div>

              {editingPermissions && (
                <div className="space-y-4">
                  {Object.entries({
                    dashboard: { label: "Dashboard" },
                    rooms: {
                      label: "Rooms",
                      sub: [
                        { key: "add", label: "Add Room" },
                        { key: "edit", label: "Edit Room Status/Details" },
                        { key: "delete", label: "Delete Room" }
                      ]
                    },
                    bookings: {
                      label: "Bookings",
                      sub: [
                        { key: "add", label: "Create Booking" },
                        { key: "edit", label: "Modify booking" },
                        { key: "delete", label: "Cancel booking" }
                      ]
                    },
                    tables: {
                      label: "Restaurant Tables",
                      sub: [
                        { key: "add", label: "Add Table / Manage Zones" },
                        { key: "edit", label: "Merge / Edit Table Status" },
                        { key: "delete", label: "Delete Table" }
                      ]
                    },
                    waitlist: {
                      label: "Waiting List",
                      sub: [
                        { key: "add", label: "Add to Waitlist" },
                        { key: "edit", label: "Update Status" },
                        { key: "delete", label: "Remove from Waitlist" }
                      ]
                    },
                    orders: {
                      label: "Restaurant Orders",
                      sub: [
                        { key: "add", label: "Create Order" },
                        { key: "edit", label: "Modify Order / Status" },
                        { key: "delete", label: "Cancel Order" },
                        { key: "waiterSide", label: "Access Waiter Side (POS Menu)" },
                        { key: "kitchenSide", label: "Access Kitchen Side (KDS Board)" }
                      ]
                    },
                    menu: {
                      label: "Restaurant Menu",
                      sub: [
                        { key: "add", label: "Add Menu Item" },
                        { key: "edit", label: "Edit Item Details / Price" },
                        { key: "delete", label: "Remove Menu Item" }
                      ]
                    },
                    billing: {
                      label: "Billing & Invoicing",
                      sub: [
                        { key: "add", label: "Generate Bills" },
                        { key: "edit", label: "Apply Discount / Modify Payment" },
                        { key: "delete", label: "Void Bill" }
                      ]
                    },
                    employees: {
                      label: "Employees (Directory)",
                      sub: [
                        { key: "add", label: "Add Employee" },
                        { key: "edit", label: "Edit Role / Profile" },
                        { key: "delete", label: "Terminate Employee" }
                      ]
                    },
                    settings: {
                      label: "System Settings",
                      sub: [
                        { key: "edit", label: "Configure Brand, Taxes & Tiers" }
                      ]
                    }
                  } as Record<string, { label: string; sub?: { key: string; label: string }[] }>).map(([moduleKey, config]) => {
                    const modulePerm = editingPermissions[moduleKey as keyof RolePermissions] || { access: false };
                    
                    return (
                      <div key={moduleKey} className="border border-border/40 rounded-xl p-4 bg-background/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{config.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{modulePerm.access ? "Enabled" : "Disabled"}</span>
                            <Switch
                              checked={modulePerm.access}
                              onCheckedChange={(checked) => {
                                setEditingPermissions(prev => {
                                  if (!prev) return null;
                                  const updated = { ...prev };
                                  updated[moduleKey as keyof RolePermissions] = {
                                    ...updated[moduleKey as keyof RolePermissions],
                                    access: checked
                                  };
                                  return updated;
                                });
                              }}
                            />
                          </div>
                        </div>

                        {/* Expandable sub-permissions */}
                        {modulePerm.access && config.sub && config.sub.length > 0 && (
                          <div className="pt-3 border-t border-dashed border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                            {config.sub.map((subItem) => {
                              const checked = !!(modulePerm as any)[subItem.key];
                              return (
                                <label key={subItem.key} className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      setEditingPermissions(prev => {
                                        if (!prev) return null;
                                        const updated = { ...prev };
                                        updated[moduleKey as keyof RolePermissions] = {
                                          ...updated[moduleKey as keyof RolePermissions],
                                          [subItem.key]: isChecked
                                        };
                                        return updated;
                                      });
                                    }}
                                    className="rounded border-border text-primary focus:ring-primary size-4"
                                  />
                                  {subItem.label}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-border/60 flex justify-end">
                    <Button
                      className="rounded-xl bg-primary text-primary-foreground font-semibold px-6"
                      onClick={() => {
                        if (!editingPermissions) return;
                        permissionService.saveRolePermissions(selectedRole, editingPermissions).then(() => {
                          refetchRoles();
                          toast.success(`Permissions for "${selectedRole}" saved successfully!`);
                        }).catch(() => {
                          toast.error(`Failed to save permissions for "${selectedRole}".`);
                        });
                      }}
                    >
                      Save Permissions
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="e.g. Receptionist, Cashier"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsAddRoleOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-primary text-primary-foreground"
              onClick={() => {
                const name = newRoleName.trim();
                if (!name) {
                  return toast.error("Role name cannot be empty.");
                }
                if (roles.some(r => r.name.toLowerCase() === name.toLowerCase())) {
                  return toast.error("A role with this name already exists.");
                }

                // Copy admin permissions as a baseline starting point
                const adminPerms = roles.find(r => r.name === "Admin")?.permissions || roles[0]?.permissions;
                
                permissionService.saveRolePermissions(name, adminPerms).then(() => {
                  refetchRoles();
                  setSelectedRole(name);
                  setIsAddRoleOpen(false);
                  setNewRoleName("");
                  toast.success(`Role "${name}" created successfully!`);
                }).catch(() => {
                  toast.error(`Failed to create role "${name}".`);
                });
              }}
            >
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
