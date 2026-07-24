import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { menuItems } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Pencil, Trash2, GripVertical, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  head: () => ({ meta: [{ title: "Menu — Aurelia" }, { name: "description", content: "Curate the culinary offering: categories, seasonal items, images and availability." }] }),
  component: MenuPage,
});

function MenuPage() {
  const cats = Array.from(new Set(menuItems.map(m => m.category)));
  return (
    <AppShell title="Menu" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Menu" }]}>
      <div className="flex items-center justify-end mb-4"><AddItemSheet /></div>

      <Tabs defaultValue={cats[0]}>
        <div className="flex items-center gap-3 flex-wrap">
          <TabsList className="rounded-xl">
            {cats.map(c => <TabsTrigger key={c} value={c} className="rounded-lg">{c}</TabsTrigger>)}
          </TabsList>
          <Button variant="ghost" size="sm" className="ml-auto"><GripVertical className="size-4 mr-1" /> Reorder categories</Button>
        </div>

        {cats.map(c => (
          <TabsContent key={c} value={c} className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.filter(m => m.category === c).map(m => (
              <Card key={m.id} className="p-0 rounded-2xl overflow-hidden">
                <div className="h-40 overflow-hidden"><img src={m.image} className="w-full h-full object-cover" /></div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <span className={cn("size-2.5 rounded-sm border", m.veg ? "border-success" : "border-destructive")}>
                          <span className={cn("block size-full rounded-[1px]", m.veg ? "bg-success" : "bg-destructive")} />
                        </span>
                        {m.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{m.description}</div>
                    </div>
                    <div className="text-primary font-medium">${m.price}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs"><Switch defaultChecked={m.available} /> Available</label>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="size-8 p-0" onClick={() => toast("Edit item")}><Pencil className="size-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="size-8 p-0 text-destructive" onClick={() => toast.warning("Confirm delete")}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}

function AddItemSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild><Button className="rounded-xl bg-primary text-primary-foreground copper-glow"><Plus className="size-4 mr-1" /> Add item</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">New menu item</SheetTitle></SheetHeader>
        <form className="mt-6 space-y-3 px-4" onSubmit={(e) => { e.preventDefault(); toast.success("Item added"); }}>
          <div><Label>Name</Label><Input className="rounded-xl mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label><Input className="rounded-xl mt-1" placeholder="Starters" /></div>
            <div><Label>Price</Label><Input className="rounded-xl mt-1" placeholder="$0" /></div>
          </div>
          <div><Label>Description</Label><Textarea className="rounded-xl mt-1" /></div>
          <div><Label>Image</Label><div className="mt-1 h-24 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs text-muted-foreground"><Upload className="size-4" /> Upload</div></div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm"><Switch /> Veg</label>
            <label className="flex items-center gap-2 text-sm"><Switch defaultChecked /> Available</label>
          </div>
          <Button className="w-full rounded-xl bg-primary text-primary-foreground copper-glow">Create item</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
