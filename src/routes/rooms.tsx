import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LayoutGrid, List, Plus, MoreHorizontal, Upload, Users, Bed, Loader2, Pencil, Calendar, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomCategoryService, type RoomCategoryDto, type SeasonalRuleDto } from "@/api/services/roomCategoryService";
import { roomService, type RoomDto } from "@/api/services/roomService";
import { settingsService } from "@/api/services/settingsService";

export const Route = createFileRoute("/rooms")({
  head: () => ({ meta: [{ title: "Rooms — Aurelia" }, { name: "description", content: "Inventory, live status and categories for every room in the property." }] }),
  component: RoomsPage,
});

function RoomsPage() {
  const [view, setView] = useState<"grid" | "table">("grid");

  return (
    <AppShell title="Rooms" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Rooms" }]}>
      <Tabs defaultValue="inventory">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <TabsList className="rounded-xl">
            <TabsTrigger value="inventory" className="rounded-lg">Inventory</TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg">Categories & Pricing</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 items-center">
            <div className="rounded-xl bg-muted p-1 flex">
              <button onClick={() => setView("grid")} className={`p-1.5 rounded-lg ${view === "grid" ? "bg-background shadow-sm" : ""}`}><LayoutGrid className="size-4" /></button>
              <button onClick={() => setView("table")} className={`p-1.5 rounded-lg ${view === "table" ? "bg-background shadow-sm" : ""}`}><List className="size-4" /></button>
            </div>
            <AddRoomSheet />
          </div>
        </div>

        <TabsContent value="inventory">
          <InventoryTab view={view} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

// ── Categories & Pricing Tab ───────────────────────────────────

function CategoriesTab() {
  const queryClient = useQueryClient();
  const [editCategory, setEditCategory] = useState<RoomCategoryDto | null>(null);
  const [rulesCategory, setRulesCategory] = useState<RoomCategoryDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings", "general"],
    queryFn: () => settingsService.getGeneralSettings()
  });

  const { data: categories = [], isFetching } = useQuery({
    queryKey: ["roomCategories"],
    queryFn: () => roomCategoryService.getAll()
  });

  const currencySymbol = settings?.currency?.includes("₹") ? "₹" : settings?.currency?.includes("$") ? "$" : settings?.currency || "₹";

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roomCategoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomCategories"] });
      toast.success("Category deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete")
  });

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button className="rounded-xl bg-primary text-primary-foreground copper-glow" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-1" /> Add category
        </Button>
      </div>

      {isFetching && categories.length === 0 && (
        <div className="py-12 text-center text-muted-foreground animate-pulse flex items-center justify-center gap-2">
          <Loader2 className="size-5 animate-spin" /> Loading categories...
        </div>
      )}

      {categories.length === 0 && !isFetching && (
        <div className="py-12 text-center text-muted-foreground border border-dashed border-border/50 rounded-2xl glass">
          No room categories yet. Click "Add category" to create one.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {categories.map(c => (
          <Card key={c.id} className="p-5 rounded-2xl hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-serif text-xl">{c.name}</div>
              <StatusBadge status={c.isActive ? "Active" : "Inactive"} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Base price</div>
                <div className="font-medium">{currencySymbol}{c.basePrice}/night</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Seasonal pricing</div>
                <div className="font-medium flex items-center gap-2">
                  {c.seasonalPricingEnabled ? "Enabled" : "Disabled"}
                  <span className={`size-2 rounded-full ${c.seasonalPricingEnabled ? "bg-success" : "bg-muted-foreground/40"}`} />
                </div>
              </div>
            </div>
            {c.capacity && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Users className="size-3" /> Capacity: {c.capacity} guests
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditCategory(c)}>
                <Pencil className="size-3.5 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setRulesCategory(c)}>
                <Calendar className="size-3.5 mr-1" /> Seasonal rules
                {c.seasonalRuleCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">{c.seasonalRuleCount}</span>
                )}
              </Button>
              <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive ml-auto" onClick={() => {
                if (confirm(`Delete category "${c.name}"?`)) deleteMutation.mutate(c.id);
              }}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modals */}
      <EditCategoryDialog category={editCategory} onClose={() => setEditCategory(null)} currencySymbol={currencySymbol} />
      <SeasonalRulesDialog category={rulesCategory} onClose={() => setRulesCategory(null)} />
      <CreateCategoryDialog open={createOpen} onClose={() => setCreateOpen(false)} currencySymbol={currencySymbol} />
    </>
  );
}

// ── Edit Category Dialog ───────────────────────────────────────

function EditCategoryDialog({ category, onClose, currencySymbol }: { category: RoomCategoryDto | null; onClose: () => void; currencySymbol: string }) {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings", "general"], queryFn: () => settingsService.getGeneralSettings() });
  const hotelAmenities = settings?.hotelAmenities || ["WiFi", "AC", "TV", "Balcony", "Minibar", "Bathtub"];

  const [form, setForm] = useState({
    name: "", basePrice: 0, currency: "INR", seasonalPricingEnabled: false,
    isActive: true, capacity: undefined as number | undefined, amenities: ""
  });

  // Sync form when category changes
  const [lastId, setLastId] = useState<number | null>(null);
  if (category && category.id !== lastId) {
    setLastId(category.id);
    setForm({
      name: category.name,
      basePrice: category.basePrice,
      currency: category.currency,
      seasonalPricingEnabled: category.seasonalPricingEnabled,
      isActive: category.isActive,
      capacity: category.capacity ?? undefined,
      amenities: category.amenities ?? ""
    });
  }
  if (!category && lastId !== null) setLastId(null);

  const updateMutation = useMutation({
    mutationFn: () => roomCategoryService.update(category!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomCategories"] });
      toast.success("Category updated");
      onClose();
    },
    onError: (err: any) => toast.error(err.message || "Failed to update")
  });

  return (
    <Dialog open={!!category} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl glass">
        <DialogHeader><DialogTitle className="font-serif text-2xl">Edit category</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); updateMutation.mutate(); }}>
          <div>
            <Label>Category name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="rounded-xl mt-1" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Base price ({currencySymbol}/night)</Label>
              <Input type="number" min={0} step="0.01" value={form.basePrice} onChange={e => setForm(f => ({...f, basePrice: parseFloat(e.target.value) || 0}))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" min={1} value={form.capacity ?? ""} onChange={e => setForm(f => ({...f, capacity: parseInt(e.target.value) || undefined}))} className="rounded-xl mt-1" placeholder="e.g. 2" />
            </div>
          </div>
          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {hotelAmenities.map(a => {
                const currentAmenities = form.amenities.split(',').map(s => s.trim()).filter(Boolean);
                const isChecked = currentAmenities.includes(a);
                return (
                  <label key={a} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        let newAmenities = [...currentAmenities];
                        if (checked) {
                          if (!newAmenities.includes(a)) newAmenities.push(a);
                        } else {
                          newAmenities = newAmenities.filter(item => item !== a);
                        }
                        setForm(f => ({ ...f, amenities: newAmenities.join(", ") }));
                      }}
                    />
                    {a}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <Label className="text-sm">Seasonal pricing</Label>
            <Switch checked={form.seasonalPricingEnabled} onCheckedChange={v => setForm(f => ({...f, seasonalPricingEnabled: v}))} />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label className="text-sm">Active</Label>
            <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({...f, isActive: v}))} />
          </div>
          <Button disabled={updateMutation.isPending} className="w-full rounded-xl bg-primary text-primary-foreground copper-glow">
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Category Dialog ─────────────────────────────────────

function CreateCategoryDialog({ open, onClose, currencySymbol }: { open: boolean; onClose: () => void; currencySymbol: string }) {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings", "general"], queryFn: () => settingsService.getGeneralSettings() });
  const hotelAmenities = settings?.hotelAmenities || ["WiFi", "AC", "TV", "Balcony", "Minibar", "Bathtub"];

  const [form, setForm] = useState({
    name: "", basePrice: 0, currency: "INR", seasonalPricingEnabled: false,
    isActive: true, capacity: undefined as number | undefined, amenities: ""
  });

  const createMutation = useMutation({
    mutationFn: () => roomCategoryService.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomCategories"] });
      toast.success("Category created");
      onClose();
      setForm({ name: "", basePrice: 0, currency: "INR", seasonalPricingEnabled: false, isActive: true, capacity: undefined, amenities: "" });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create")
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl glass">
        <DialogHeader><DialogTitle className="font-serif text-2xl">New room category</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); createMutation.mutate(); }}>
          <div>
            <Label>Category name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="rounded-xl mt-1" required placeholder="e.g. Deluxe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Base price ({currencySymbol}/night)</Label>
              <Input type="number" min={0} step="0.01" value={form.basePrice || ""} onChange={e => setForm(f => ({...f, basePrice: parseFloat(e.target.value) || 0}))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" min={1} value={form.capacity ?? ""} onChange={e => setForm(f => ({...f, capacity: parseInt(e.target.value) || undefined}))} className="rounded-xl mt-1" placeholder="e.g. 2" />
            </div>
          </div>
          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {hotelAmenities.map(a => {
                const currentAmenities = form.amenities.split(',').map(s => s.trim()).filter(Boolean);
                const isChecked = currentAmenities.includes(a);
                return (
                  <label key={a} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        let newAmenities = [...currentAmenities];
                        if (checked) {
                          if (!newAmenities.includes(a)) newAmenities.push(a);
                        } else {
                          newAmenities = newAmenities.filter(item => item !== a);
                        }
                        setForm(f => ({ ...f, amenities: newAmenities.join(", ") }));
                      }}
                    />
                    {a}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <Label className="text-sm">Seasonal pricing</Label>
            <Switch checked={form.seasonalPricingEnabled} onCheckedChange={v => setForm(f => ({...f, seasonalPricingEnabled: v}))} />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label className="text-sm">Active</Label>
            <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({...f, isActive: v}))} />
          </div>
          <Button disabled={createMutation.isPending} className="w-full rounded-xl bg-primary text-primary-foreground copper-glow">
            {createMutation.isPending ? "Creating..." : "Create category"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Seasonal Rules Dialog ──────────────────────────────────────

function SeasonalRulesDialog({ category, onClose }: { category: RoomCategoryDto | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [addingRule, setAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<SeasonalRuleDto | null>(null);

  const { data: rules = [], isFetching } = useQuery({
    queryKey: ["seasonalRules", category?.id],
    queryFn: () => roomCategoryService.getSeasonalRules(category!.id),
    enabled: !!category
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: number) => roomCategoryService.deleteSeasonalRule(category!.id, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasonalRules", category?.id] });
      queryClient.invalidateQueries({ queryKey: ["roomCategories"] });
      toast.success("Rule deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete rule")
  });

  return (
    <Dialog open={!!category} onOpenChange={(o) => { if (!o) { onClose(); setAddingRule(false); setEditingRule(null); } }}>
      <DialogContent className="max-w-lg rounded-2xl glass max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Seasonal rules — {category?.name}</DialogTitle>
        </DialogHeader>

        {isFetching ? (
          <div className="py-8 text-center text-muted-foreground animate-pulse flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading rules...
          </div>
        ) : rules.length === 0 && !addingRule ? (
          <div className="py-8 text-center text-muted-foreground border border-dashed rounded-xl">
            No seasonal rules defined yet.
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              editingRule?.id === rule.id ? (
                <RuleForm
                  key={rule.id}
                  categoryId={category!.id}
                  rule={rule}
                  onDone={() => setEditingRule(null)}
                />
              ) : (
                <div key={rule.id} className="p-3 border rounded-xl flex items-start justify-between gap-3 hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm">{rule.name}</div>
                      <span className={`size-2 rounded-full ${rule.isActive ? "bg-success" : "bg-muted-foreground/40"}`} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {rule.isRecurring ? (
                        <>Every {rule.daysOfWeek}</>
                      ) : (
                        <>
                          {rule.startDate ? new Date(rule.startDate).toLocaleDateString() : "—"} → {rule.endDate ? new Date(rule.endDate).toLocaleDateString() : "—"}
                        </>
                      )}
                    </div>
                    <div className={`text-sm font-bold mt-1 ${rule.priceModifierPercent >= 0 ? "text-destructive" : "text-success"}`}>
                      {rule.priceModifierPercent >= 0 ? "+" : ""}{rule.priceModifierPercent}%
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => setEditingRule(rule)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(rule.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {addingRule ? (
          <RuleForm categoryId={category!.id} onDone={() => setAddingRule(false)} />
        ) : (
          <Button variant="outline" className="w-full rounded-xl mt-2" onClick={() => setAddingRule(true)}>
            <Plus className="size-4 mr-1" /> Add rule
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Inline Rule Form (used for both Create and Edit) ───────────

function RuleForm({ categoryId, rule, onDone }: { categoryId: number; rule?: SeasonalRuleDto; onDone: () => void }) {
  const queryClient = useQueryClient();
  const isEditing = !!rule;

  const [form, setForm] = useState({
    name: rule?.name ?? "",
    startDate: rule?.startDate ? rule.startDate.split("T")[0] : "",
    endDate: rule?.endDate ? rule.endDate.split("T")[0] : "",
    isRecurring: rule?.isRecurring ?? false,
    daysOfWeek: rule?.daysOfWeek ?? "",
    priceModifierPercent: rule?.priceModifierPercent ?? 0,
    isActive: rule?.isActive ?? true,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const dto = {
        ...form,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        daysOfWeek: form.daysOfWeek || undefined,
      };
      return isEditing
        ? roomCategoryService.updateSeasonalRule(categoryId, rule!.id, dto)
        : roomCategoryService.createSeasonalRule(categoryId, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasonalRules", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["roomCategories"] });
      toast.success(isEditing ? "Rule updated" : "Rule created");
      onDone();
    },
    onError: (err: any) => toast.error(err.message || "Failed to save rule")
  });

  return (
    <div className="p-3 border border-primary/30 rounded-xl bg-muted/10 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-primary">{isEditing ? "Edit rule" : "New rule"}</div>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded" onClick={onDone}><X className="size-3.5" /></Button>
      </div>
      <Input placeholder="Rule name (e.g. Winter Peak)" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="rounded-lg h-8 text-sm" required />
      <div className="flex items-center gap-2">
        <Label className="text-xs whitespace-nowrap">Recurring?</Label>
        <Switch checked={form.isRecurring} onCheckedChange={v => setForm(f => ({...f, isRecurring: v}))} />
      </div>
      {form.isRecurring ? (
        <Input placeholder="Days (e.g. Saturday,Sunday)" value={form.daysOfWeek} onChange={e => setForm(f => ({...f, daysOfWeek: e.target.value}))} className="rounded-lg h-8 text-sm" />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} className="rounded-lg h-8 text-sm" />
          <Input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} className="rounded-lg h-8 text-sm" />
        </div>
      )}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-xs">Price modifier %</Label>
          <Input type="number" value={form.priceModifierPercent} onChange={e => setForm(f => ({...f, priceModifierPercent: parseFloat(e.target.value) || 0}))} className="rounded-lg h-8 text-sm mt-0.5" placeholder="+30 or -10" />
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-xs">Active</Label>
          <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({...f, isActive: v}))} />
        </div>
      </div>
      <Button size="sm" className="w-full rounded-lg bg-primary text-primary-foreground" disabled={saveMutation.isPending || !form.name} onClick={() => saveMutation.mutate()}>
        {saveMutation.isPending ? "Saving..." : isEditing ? "Update rule" : "Add rule"}
      </Button>
    </div>
  );
}

// ── Add Room Sheet (existing) ──────────────────────────────────

function AddRoomSheet() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: settings } = useQuery({ queryKey: ["settings", "general"], queryFn: () => settingsService.getGeneralSettings() });
  const hotelAmenities = settings?.hotelAmenities || ["WiFi", "AC", "TV", "Balcony", "Minibar", "Bathtub"];

  const { data: categories = [], isFetching } = useQuery({
    queryKey: ["roomCategories"],
    queryFn: () => roomCategoryService.getAll()
  });

  const [number, setNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Available");

  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const selectedCategory = categories.find(c => c.name === selectedCategoryName);
  const maxCapacity = selectedCategory?.capacity;

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [capacity, setCapacity] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setNumber("");
      setFloor("");
      setDescription("");
      setStatus("Available");
      setSelectedCategoryName("");
      setSelectedAmenities(hotelAmenities);
      setCapacity("");
      setPrice("");
      setImages([]);
    }
  }, [open, hotelAmenities]);



  const createMutation = useMutation({
    mutationFn: () => roomService.create({
      number,
      categoryId: selectedCategory?.id || 0,
      floor,
      capacity: parseInt(capacity) || 2,
      basePrice: parseFloat(price) || 0,
      status,
      amenities: selectedAmenities.filter(a => hotelAmenities.map(x => x.toLowerCase()).includes(a.toLowerCase())),
      images: images,
      description
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room created");
      setOpen(false);
      setNumber(""); setFloor(""); setDescription("");
      // keep other state mostly same or reset it if needed
    },
    onError: (err: any) => toast.error(err.message || "Failed to create")
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button className="rounded-xl bg-primary text-primary-foreground copper-glow"><Plus className="size-4 mr-1" /> Add room</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">New room</SheetTitle><SheetDescription>Add a room to the inventory.</SheetDescription></SheetHeader>
        <form className="space-y-4 mt-6 px-4" onSubmit={(e) => { 
          e.preventDefault(); 
          if (!selectedCategory) return toast.error("Please select a category");
          createMutation.mutate(); 
        }}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Room number</Label><Input required value={number} onChange={e => setNumber(e.target.value)} placeholder="308" className="rounded-xl mt-1" /></div>
            <div><Label>Floor</Label><Input value={floor} onChange={e => setFloor(e.target.value)} placeholder="3" className="rounded-xl mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <Select 
                disabled={isFetching} 
                value={selectedCategoryName} 
                onValueChange={(val) => {
                  setSelectedCategoryName(val);
                  const cat = categories.find(c => c.name === val);
                  if (cat) {
                    setSelectedAmenities((cat.amenities || "").split(',').map(s => s.trim()).filter(Boolean));
                    if (cat.capacity) setCapacity(cat.capacity.toString());
                    if (cat.basePrice !== undefined) setPrice(cat.basePrice.toString());
                  }
                }}
              >
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder={isFetching ? "Select" : "Select"} /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} min={1} max={maxCapacity || undefined} placeholder={maxCapacity ? `Max ${maxCapacity}` : "2"} className="rounded-xl mt-1" />
            </div>
          </div>
          <div><Label>Price / night</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="220" className="rounded-xl mt-1" /></div>
          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {hotelAmenities.map(a => {
                const categoryAmenities = selectedCategory ? (selectedCategory.amenities || "").split(',').map(s => s.trim()).filter(Boolean) : null;
                const isAvailable = categoryAmenities === null || categoryAmenities.includes(a);
                const isChecked = selectedAmenities.includes(a);
                
                return (
                  <label key={a} className={`flex items-center gap-2 text-sm ${!isAvailable ? "opacity-50" : ""}`}>
                    <Checkbox 
                      checked={isChecked && isAvailable} 
                      disabled={!isAvailable}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAmenities(prev => [...prev, a]);
                        } else {
                          setSelectedAmenities(prev => prev.filter(item => item !== a));
                        }
                      }}
                    /> 
                    {a}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Images</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative h-20 rounded-xl overflow-hidden group border bg-muted">
                  <img src={img} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 size-5 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <label className="h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-[10px] text-muted-foreground gap-1 cursor-pointer hover:bg-muted/20 transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden"
                  onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      const files = Array.from(e.target.files);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImages(prev => [...prev, reader.result as string]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }} 
                />
                <Upload className="size-3.5" />
                <span>Upload Photos</span>
              </label>
            </div>
          </div>
          <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Notes about the room…" className="rounded-xl mt-1" /></div>
          <Button disabled={createMutation.isPending} className="w-full rounded-xl bg-primary text-primary-foreground copper-glow">
            {createMutation.isPending ? "Creating..." : "Create room"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function RoomImageSlider({ images, alt }: { images: string[]; alt: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!images || images.length <= 1 || !isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [images, isHovered]);

  if (!images || images.length === 0) return null;

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentIndex(0);
      }}
    >
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`${alt} - ${index}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            index === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-10">
          {images.map((_, index) => (
            <span
              key={index}
              className={`size-1.5 rounded-full transition-all ${
                index === currentIndex ? "bg-white w-3" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inventory Tab ─────────────────────────────────────────────

function InventoryTab({ view }: { view: "grid" | "table" }) {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings", "general"], queryFn: () => settingsService.getGeneralSettings() });
  const currencySymbol = settings?.currency?.includes("₹") ? "₹" : settings?.currency?.includes("$") ? "$" : settings?.currency || "₹";

  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [search, setSearch] = useState("");

  const { data: categories = [] } = useQuery({ queryKey: ["roomCategories"], queryFn: () => roomCategoryService.getAll() });
  
  const { data: rooms = [], isFetching } = useQuery({
    queryKey: ["rooms", categoryFilter, statusFilter],
    queryFn: () => roomService.getAll({ 
      categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined
    })
  });

  const filteredRooms = (rooms as RoomDto[]).filter(r => r.number.toLowerCase().includes(search.toLowerCase()));

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roomService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete")
  });

  const [editRoom, setEditRoom] = useState<RoomDto | null>(null);

  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "available": return "bg-success text-success-foreground border-success/30";
      case "occupied": return "bg-destructive/10 text-destructive border-destructive/30";
      case "maintenance": return "bg-warning/20 text-warning border-warning/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input placeholder="Search room number..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 rounded-xl" />
        <Select value={categoryFilter.toString()} onValueChange={v => setCategoryFilter(v === "all" ? "all" : parseInt(v))}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Occupied">Occupied</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Out of service">Out of service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isFetching && rooms.length === 0 && <div className="py-12 text-center text-muted-foreground animate-pulse">Loading rooms...</div>}

      {!isFetching && filteredRooms.length === 0 && (
        <div className="py-16 text-center border border-dashed border-border/50 rounded-2xl glass">
          <Bed className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <div className="font-serif text-xl text-muted-foreground">No rooms found</div>
          <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters or adding a new room.</p>
        </div>
      )}

      {filteredRooms.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map((r: RoomDto) => {
            return (
            <Card key={r.id} className="p-4 rounded-2xl hover:border-primary/30 transition-colors flex flex-col overflow-hidden">
              {r.images && r.images.length > 0 && (
                <div className="h-32 -mx-4 -mt-4 mb-3 bg-muted flex items-center justify-center overflow-hidden relative">
                  <RoomImageSlider images={r.images} alt={r.number} />
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-serif text-2xl font-bold">{r.number}</div>
                  <div className="text-xs text-muted-foreground bg-muted inline-flex px-2 py-0.5 rounded-full mt-1">{r.category?.name || "Unknown"}</div>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(r.status)}`}>
                  {r.status}
                </div>
              </div>
              <div className="text-sm mt-2 flex-grow">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Price</span>
                  <span>{currencySymbol}{r.basePrice}/night</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Capacity</span>
                  <span><Users className="size-3 inline mr-1" />{r.capacity}</span>
                </div>
                {r.floor && (
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Floor</span>
                    <span>{r.floor}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={() => setEditRoom(r)}><Pencil className="size-3.5 mr-1" /> Edit</Button>
                <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive" onClick={() => {
                  if(confirm(`Delete room ${r.number}?`)) deleteMutation.mutate(r.id);
                }}><Trash2 className="size-3.5" /></Button>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {filteredRooms.length > 0 && view === "table" && (
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/30">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Room</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Capacity</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredRooms.map((r: RoomDto) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{r.number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.category?.name || "Unknown"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">{currencySymbol}{r.basePrice}</td>
                  <td className="px-4 py-3">{r.capacity}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="icon" variant="ghost" className="size-8 rounded-lg" onClick={() => setEditRoom(r)}><Pencil className="size-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="size-8 rounded-lg text-destructive hover:text-destructive ml-1" onClick={() => {
                      if(confirm(`Delete room ${r.number}?`)) deleteMutation.mutate(r.id);
                    }}><Trash2 className="size-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Room Sheet */}
      {editRoom && <EditRoomSheet room={editRoom} onClose={() => setEditRoom(null)} />}
    </>
  );
}

// ── Edit Room Sheet ───────────────────────────────────────────

function EditRoomSheet({ room, onClose }: { room: RoomDto, onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings", "general"], queryFn: () => settingsService.getGeneralSettings() });
  const hotelAmenities = settings?.hotelAmenities || ["WiFi", "AC", "TV", "Balcony", "Minibar", "Bathtub"];
  const { data: categories = [] } = useQuery({ queryKey: ["roomCategories"], queryFn: () => roomCategoryService.getAll() });

  const [number, setNumber] = useState(room.number);
  const [floor, setFloor] = useState(room.floor || "");
  const [description, setDescription] = useState(room.description || "");
  const [status, setStatus] = useState(room.status);
  const [capacity, setCapacity] = useState(room.capacity.toString());
  const [price, setPrice] = useState(room.basePrice.toString());
  
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(room.category?.name || "");
  const selectedCategory = categories.find(c => c.name === selectedCategoryName);
  const maxCapacity = selectedCategory?.capacity;

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(room.amenities || []);
  const [images, setImages] = useState<string[]>(room.images || []);
 
  const updateMutation = useMutation({
    mutationFn: () => roomService.update(room.id, {
      number,
      categoryId: selectedCategory?.id || room.categoryId,
      floor,
      capacity: parseInt(capacity) || 2,
      basePrice: parseFloat(price) || 0,
      status,
      amenities: selectedAmenities.filter(a => hotelAmenities.map(x => x.toLowerCase()).includes(a.toLowerCase())),
      images: images,
      description
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room updated");
      onClose();
    },
    onError: (err: any) => toast.error(err.message || "Failed to update")
  });

  return (
    <Sheet open={true} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">Edit room {room.number}</SheetTitle></SheetHeader>
        <form className="space-y-4 mt-6 px-4" onSubmit={(e) => { 
          e.preventDefault(); 
          if (!selectedCategory && !room.categoryId) return toast.error("Please select a category");
          updateMutation.mutate(); 
        }}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Room number</Label><Input required value={number} onChange={e => setNumber(e.target.value)} className="rounded-xl mt-1" /></div>
            <div><Label>Floor</Label><Input value={floor} onChange={e => setFloor(e.target.value)} className="rounded-xl mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <Select 
                value={selectedCategoryName} 
                onValueChange={(val) => {
                  setSelectedCategoryName(val);
                  const cat = categories.find(c => c.name === val);
                  if (cat) {
                    setSelectedAmenities((cat.amenities || "").split(',').map(s => s.trim()).filter(Boolean));
                    if (cat.capacity) setCapacity(cat.capacity.toString());
                    if (cat.basePrice !== undefined) setPrice(cat.basePrice.toString());
                  }
                }}
              >
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} min={1} max={maxCapacity || undefined} className="rounded-xl mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price / night</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="rounded-xl mt-1" /></div>
            <div><Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Occupied">Occupied</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Out of service">Out of service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {hotelAmenities.map(a => {
                const catAmenities = selectedCategory ? (selectedCategory.amenities || "") : (room.category?.amenities || "");
                const categoryAmenities = catAmenities.split(',').map(s => s.trim()).filter(Boolean);
                const isAvailable = categoryAmenities.length === 0 || categoryAmenities.includes(a);
                const isChecked = selectedAmenities.includes(a);
                
                return (
                  <label key={a} className={`flex items-center gap-2 text-sm ${!isAvailable ? "opacity-50" : ""}`}>
                    <Checkbox 
                      checked={isChecked && isAvailable} 
                      disabled={!isAvailable}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAmenities(prev => [...prev, a]);
                        } else {
                          setSelectedAmenities(prev => prev.filter(item => item !== a));
                        }
                      }}
                    /> 
                    {a}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Images</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative h-20 rounded-xl overflow-hidden group border bg-muted">
                  <img src={img} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 size-5 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <label className="h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-[10px] text-muted-foreground gap-1 cursor-pointer hover:bg-muted/20 transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden"
                  onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      const files = Array.from(e.target.files);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImages(prev => [...prev, reader.result as string]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }} 
                />
                <Upload className="size-3.5" />
                <span>Upload Photos</span>
              </label>
            </div>
          </div>
          <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl mt-1" /></div>
          <Button disabled={updateMutation.isPending} className="w-full rounded-xl bg-primary text-primary-foreground copper-glow">
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
