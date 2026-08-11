import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService, categoryService, MenuGrouped } from "@/api";
import { settingsService } from "@/api/services/settingsService";
import { BASE_URL } from "@/api/apiClient";
import { MenuItem } from "@/types/models";
import { extractCurrencySymbol } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Plus, Pencil, Trash2, GripVertical, Leaf, Drumstick, UtensilsCrossed, Edit
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Aurelia" },
      { name: "description", content: "Curate the culinary offering: categories, seasonal items, images and availability." }
    ]
  }),
  component: MenuPage,
});

function MenuPage() {
  const queryClient = useQueryClient();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [isReorderCatOpen, setIsReorderCatOpen] = useState(false);
  const [itemModal, setItemModal] = useState<{ isOpen: boolean; mode: "create" | "edit"; initialData?: MenuItem | null }>({
    isOpen: false,
    mode: "create",
    initialData: null
  });

  const { data: menuData = [], isLoading } = useQuery<MenuGrouped[]>({
    queryKey: ["groupedMenu"],
    queryFn: menuService.getGrouped
  });

  // Automatically set first category as active category
  useEffect(() => {
    if (menuData.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(menuData[0].categoryId);
    }
  }, [menuData, activeCategoryId]);

  const activeCategory = menuData.find(c => c.categoryId === activeCategoryId) || menuData[0];

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupedMenu"] });
      toast.success("Category deleted successfully");
      setActiveCategoryId(null);
    },
    onError: (err: any) => {
      if (err.message?.includes("409") || (err.status === 409)) {
        toast.error("Cannot delete category with items inside. Move or delete items first.");
      } else {
        toast.error("Cannot delete category with items inside. Move or delete items first.");
      }
    }
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (id: number) => menuService.toggleAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupedMenu"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update availability");
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => menuService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupedMenu"] });
      toast.success("Menu item deleted");
    },
    onError: () => toast.error("Failed to delete item")
  });

  if (isLoading) {
    return (
      <AppShell title="Menu" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Menu" }]}>
        <div className="space-y-6">
          <div className="h-10 w-96 bg-muted/60 animate-pulse rounded-xl" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted/60 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (menuData.length === 0) {
    return (
      <AppShell title="Menu" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Menu" }]}>
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border-2 border-dashed border-white/5 rounded-2xl">
          <UtensilsCrossed className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No categories yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Create a category to start building your menu.</p>
          <Button onClick={() => setIsAddCatOpen(true)} className="rounded-xl bg-primary text-primary-foreground copper-glow">
            <Plus className="size-4 mr-1" /> Add category
          </Button>
          <AddCategoryModal isOpen={isAddCatOpen} onClose={() => setIsAddCatOpen(false)} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Menu" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Menu" }]}>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <CategoryTabs
          data={menuData}
          activeCategoryId={activeCategoryId || menuData[0].categoryId}
          onSelect={setActiveCategoryId}
          onAddClick={() => setIsAddCatOpen(true)}
          onReorderClick={() => setIsReorderCatOpen(true)}
          onDeleteCategory={(id) => {
            if (confirm("Are you sure you want to delete this category?")) {
              deleteCategoryMutation.mutate(id);
            }
          }}
        />
        <Button
          onClick={() => setItemModal({ isOpen: true, mode: "create", initialData: null })}
          className="rounded-xl bg-primary text-primary-foreground copper-glow ml-auto"
        >
          <Plus className="size-4 mr-1" /> Add item
        </Button>
      </div>

      {activeCategory && (
        <MenuGrid
          items={activeCategory.items}
          onEdit={(item) => setItemModal({ isOpen: true, mode: "edit", initialData: item })}
          onDelete={(id) => {
            if (confirm("Are you sure you want to delete this item?")) {
              deleteItemMutation.mutate(id);
            }
          }}
          onToggle={(id) => toggleAvailabilityMutation.mutate(id)}
        />
      )}

      <AddCategoryModal
        isOpen={isAddCatOpen}
        onClose={() => setIsAddCatOpen(false)}
      />

      <ReorderCategoriesModal
        isOpen={isReorderCatOpen}
        categories={menuData}
        onClose={() => setIsReorderCatOpen(false)}
      />

      <ItemFormModal
        isOpen={itemModal.isOpen}
        mode={itemModal.mode}
        categories={menuData}
        initialData={itemModal.initialData}
        onClose={() => setItemModal({ isOpen: false, mode: "create", initialData: null })}
      />
    </AppShell>
  );
}

// Category Tabs Component
interface CategoryTabsProps {
  data: MenuGrouped[];
  activeCategoryId: number;
  onSelect: (id: number) => void;
  onAddClick: () => void;
  onReorderClick: () => void;
  onDeleteCategory: (id: number) => void;
}

function CategoryTabs({ data, activeCategoryId, onSelect, onAddClick, onReorderClick, onDeleteCategory }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex bg-muted/50 p-1.5 rounded-xl border border-white/5 flex-wrap gap-1">
        {data.map((c) => {
          const isActive = c.categoryId === activeCategoryId;
          return (
            <div key={c.categoryId} className="relative group flex items-center">
              <button
                onClick={() => onSelect(c.categoryId)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground border border-primary/20 shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {c.categoryName}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteCategory(c.categoryId); }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive absolute -top-1 -right-1 bg-background size-5 rounded-full border border-border shadow flex items-center justify-center transition-all cursor-pointer text-[10px]"
                title="Delete category"
              >
                ×
              </button>
            </div>
          );
        })}
        <button
          onClick={onAddClick}
          className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition border border-dashed border-white/10"
          title="Add Category"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Button onClick={onReorderClick} variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-foreground font-medium rounded-xl">
        <GripVertical className="size-4 mr-1 text-muted-foreground" /> Reorder categories
      </Button>
    </div>
  );
}

// Menu Grid Component
interface MenuGridProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

function MenuGrid({ items, onEdit, onDelete, onToggle }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/10 border border-white/5 rounded-2xl">
        <UtensilsCrossed className="size-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No items in this category yet</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

// Menu Item Card Component
interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

function MenuItemCard({ item, onEdit, onDelete, onToggle }: MenuItemCardProps) {
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: settingsService.getGeneralSettings });
  const currency = extractCurrencySymbol(settings?.currency);
  const [localAvailable, setLocalAvailable] = useState(item.available);

  // Sync state with props
  useEffect(() => {
    setLocalAvailable(item.available);
  }, [item.available]);

  const handleToggle = () => {
    const nextVal = !localAvailable;
    setLocalAvailable(nextVal); // Optimistic Update
    onToggle(item.id!);
  };

  const getFoodImage = (imagePath?: string) => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  return (
    <Card className={cn(
      "p-0 rounded-2xl overflow-hidden border border-white/10 flex flex-col transition-all duration-300",
      !localAvailable && "opacity-60"
    )}>
      <div className="h-40 overflow-hidden bg-muted/40 relative flex items-center justify-center">
        {item.image ? (
          <img src={getFoodImage(item.image)} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <UtensilsCrossed className="size-12 text-muted-foreground opacity-30" />
        )}
        <div className="absolute right-3 top-3 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-white/5">
          <span className={cn("size-2 rounded-full", item.veg ? "bg-success" : "bg-destructive")} />
          <span className="text-[10px] font-semibold text-white uppercase tracking-wider">{item.veg ? "Veg" : "Non-Veg"}</span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-semibold text-base line-clamp-1">{item.name}</h4>
            <span className="text-primary font-bold text-base leading-none mt-0.5">{currency}{item.price}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[32px]">{item.description}</p>
        </div>
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <Switch checked={localAvailable} onCheckedChange={handleToggle} />
            Available
          </label>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="size-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => onEdit(item)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="size-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 cursor-pointer" onClick={() => onDelete(item.id!)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Add Category Modal Component
interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddCategoryModal({ isOpen, onClose }: AddCategoryModalProps) {
  const queryClient = useQueryClient();
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => categoryService.create({ name, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupedMenu"] });
      toast.success("Category created successfully");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create category");
    }
  });

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">New Category</SheetTitle></SheetHeader>
        <form className="mt-6 space-y-4 px-4" onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const name = data.get("name") as string;
          if (name?.trim()) {
            createCategoryMutation.mutate(name.trim());
          }
        }}>
          <div>
            <Label htmlFor="cat-name">Category Name</Label>
            <Input id="cat-name" name="name" className="rounded-xl mt-1.5" placeholder="e.g. Desserts, Main Course" required />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="rounded-xl bg-primary text-primary-foreground copper-glow">Create Category</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// Reorder Categories Modal Component
interface ReorderCategoriesModalProps {
  isOpen: boolean;
  categories: MenuGrouped[];
  onClose: () => void;
}

function ReorderCategoriesModal({ isOpen, categories, onClose }: ReorderCategoriesModalProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<MenuGrouped[]>(categories);

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  const reorderMutation = useMutation({
    mutationFn: (positions: { id: number; position: number }[]) => categoryService.reorder(positions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupedMenu"] });
      toast.success("Categories reordered successfully");
      onClose();
    },
    onError: () => {
      toast.error("Failed to reorder categories");
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen) return null;

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((c) => c.categoryId === active.id);
        const newIndex = prev.findIndex((c) => c.categoryId === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    const payload = items.map((item, index) => ({
      id: item.categoryId,
      position: index,
    }));
    reorderMutation.mutate(payload);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">Reorder Categories</SheetTitle></SheetHeader>
        <div className="mt-6 px-4 space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(c => c.categoryId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {items.map((c) => (
                  <SortableCategoryItem key={c.categoryId} id={c.categoryId} name={c.categoryName} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
            <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button>
            <Button className="rounded-xl bg-primary text-primary-foreground copper-glow" onClick={handleSave}>Save Order</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Sortable Category Item Helper Component
function SortableCategoryItem({ id, name }: { id: number; name: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-muted/60 hover:bg-muted border border-white/5 rounded-xl flex items-center justify-between cursor-grab active:cursor-grabbing text-sm font-medium transition"
    >
      <span>{name}</span>
      <GripVertical className="size-4 text-muted-foreground" />
    </div>
  );
}

// Item Form Modal (Create & Edit) Component
interface ItemFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  categories: MenuGrouped[];
  initialData?: MenuItem | null;
  onClose: () => void;
}

function ItemFormModal({ isOpen, mode, categories, initialData, onClose }: ItemFormModalProps) {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: settingsService.getGeneralSettings });
  const currency = extractCurrencySymbol(settings?.currency);
  const [veg, setVeg] = useState(true);
  const [available, setAvailable] = useState(true);

  // Sync state
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setVeg(initialData.veg);
      setAvailable(initialData.available);
    } else {
      setVeg(true);
      setAvailable(true);
    }
  }, [mode, initialData, isOpen]);

  const createItemMutation = useMutation({
    mutationFn: (item: Partial<MenuItem>) => menuService.create(item),
    onError: () => toast.error("Failed to create menu item")
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, item }: { id: number; item: Partial<MenuItem> }) => menuService.update(id, item),
    onError: () => toast.error("Failed to update menu item")
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => menuService.uploadImage(id, file),
    onError: () => toast.error("Failed to upload menu item image")
  });

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">
            {mode === "create" ? "New Menu Item" : "Edit Menu Item"}
          </SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-4 px-4" onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const fileInput = formData.get("imageFile") as File;

          const price = parseFloat(formData.get("price") as string);
          if (isNaN(price) || price <= 0) {
            toast.error("Price must be greater than 0");
            return;
          }

          const categoryId = parseInt(formData.get("categoryId") as string);
          if (isNaN(categoryId)) {
            toast.error("Please select a valid category");
            return;
          }

          const itemData: Partial<MenuItem> = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            price,
            categoryId,
            veg,
            available
          };

          // If editing and no new file was uploaded, keep old image
          if (mode === "edit" && initialData) {
            itemData.image = initialData.image;
          }

          try {
            let itemId = initialData?.id;
            if (mode === "create") {
              const created = await createItemMutation.mutateAsync(itemData);
              itemId = created.id;
            } else if (mode === "edit" && itemId) {
              await updateItemMutation.mutateAsync({ id: itemId, item: { ...initialData, ...itemData } });
            }

            if (fileInput && fileInput.size > 0 && itemId) {
              try {
                await uploadImageMutation.mutateAsync({ id: itemId, file: fileInput });
              } catch (uploadErr) {
                console.error("Failed to upload image:", uploadErr);
              }
            }

            queryClient.invalidateQueries({ queryKey: ["groupedMenu"] });
            toast.success(mode === "create" ? "Menu item created successfully" : "Menu item updated successfully");
            onClose();
          } catch (err: any) {
            console.error("Submit error:", err);
            toast.error(err?.message || "Failed to save menu item changes");
          }
        }}>
          <div>
            <Label htmlFor="item-name">Name</Label>
            <Input id="item-name" name="name" defaultValue={initialData?.name} className="rounded-xl mt-1.5" required placeholder="e.g. Spicy Garlic Edamame" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="item-category">Category</Label>
              <select
                id="item-category"
                name="categoryId"
                defaultValue={initialData?.categoryId || categories[0]?.categoryId}
                className="w-full border border-white/10 rounded-xl h-10 px-3 mt-1.5 bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="item-price">Price</Label>
              <Input id="item-price" name="price" type="number" step="0.01" min="0.01" defaultValue={initialData?.price} className="rounded-xl mt-1.5" placeholder={`${currency}0.00`} required />
            </div>
          </div>

          <div>
            <Label htmlFor="item-desc">Description</Label>
            <Textarea id="item-desc" name="description" defaultValue={initialData?.description} className="rounded-xl mt-1.5" placeholder="Describe the flavors, ingredients, sides..." />
          </div>

          <div>
            <Label htmlFor="item-image">Image File</Label>
            <Input id="item-image" name="imageFile" type="file" accept="image/*" className="rounded-xl mt-1.5" />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <Switch checked={veg} onCheckedChange={setVeg} />
              Vegetarian (Veg)
            </label>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <Switch checked={available} onCheckedChange={setAvailable} />
              Available
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="rounded-xl bg-primary text-primary-foreground copper-glow">
              {mode === "create" ? "Create Item" : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// Helper to remove host domain when filling URL input in edit mode
function itemImageOnlyPath(url?: string) {
  if (!url) return "";
  if (url.startsWith("https://hotel-backend.runasp.net")) {
    return url.replace("https://hotel-backend.runasp.net", "");
  }
  return url;
}
