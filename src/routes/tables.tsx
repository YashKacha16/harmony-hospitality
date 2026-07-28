import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Combine, Split, Plus, MousePointerClick, Trash2, 
  X, ChevronDown, AlertTriangle, QrCode 
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tableService } from "@/api/services/tableService";
import { orderService } from "@/api/services/orderService";
import { TableQrModal } from "@/components/TableQrModal";

export const Route = createFileRoute("/tables")({
  head: () => ({ 
    meta: [
      { title: "Tables — Aurelia" }, 
      { name: "description", content: "Interactive restaurant floor plan with merge, split and zone management." }
    ] 
  }),
  component: TablesPage,
});

const statusColor: Record<string, string> = {
  Free: "bg-success/20 border-success text-success",
  Occupied: "bg-destructive/20 border-destructive text-destructive",
  Reserved: "bg-warning/20 border-warning [color:var(--warning)]",
  Cleaning: "bg-muted border-muted-foreground/30 text-muted-foreground",
  Merged: "bg-special/20 border-special [color:var(--special)]",
};

const statusLegendColors: Record<string, string> = {
  Free: "bg-success border-success",
  Occupied: "bg-destructive border-destructive",
  Reserved: "bg-warning border-warning",
  Cleaning: "bg-muted-foreground/60 border-muted-foreground/60",
  Merged: "bg-special border-special",
};

function TablesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [zone, setZone] = useState("All");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sideTableId, setSideTableId] = useState<number | null>(null);

  // QR Modal State
  const [qrModalTable, setQrModalTable] = useState<{ id: number; name: string; qrToken: string } | null>(null);

  // Add Table states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newTable, setNewTable] = useState({
    name: "",
    capacity: 4,
    categoryId: null as number | null,
  });

  // Manage Zones states
  const [isManageZonesOpen, setIsManageZonesOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");

  // Dropdowns in floating action bar
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Queries
  const { data: groupedTables = [], isLoading } = useQuery({
    queryKey: ["groupedTables"],
    queryFn: tableService.getGrouped
  });

  // Dynamic table categories dropdown query
  const { data: tableCategories = [] } = useQuery({
    queryKey: ["tableCategories"],
    queryFn: tableService.getTableCategories
  });

  const { data: kanbanOrders } = useQuery({
    queryKey: ["kanbanOrders", "DineIn"],
    queryFn: () => orderService.getKanban("DineIn")
  });

  // Flattened tables for search and mapping
  const allTables = groupedTables.flatMap(g => g.tables);

  // Filtered tables based on tab
  const tables = zone === "All"
    ? allTables
    : (groupedTables.find(g => g.categoryName === zone)?.tables || []);

  // Mutations
  const mergeMutation = useMutation({
    mutationFn: (ids: number[]) => tableService.merge(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupedTables"] });
      toast.success(`Tables merged successfully`);
      setSelectedIds([]);
      setSelectMode(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to merge tables");
    }
  });

  const unmergeMutation = useMutation({
    mutationFn: (mergeGroupId: number) => tableService.unmerge(mergeGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupedTables"] });
      toast.success("Tables successfully split/unmerged");
      setSideTableId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to unmerge tables");
    }
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[], status: string }) => tableService.bulkStatus(ids, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["groupedTables"] });
      toast.success(`Updated status of ${variables.ids.length} tables to ${variables.status}`);
      setSelectedIds([]);
      setSelectMode(false);
      setShowStatusDropdown(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    }
  });

  const bulkCategoryMutation = useMutation({
    mutationFn: ({ ids, catId }: { ids: number[], catId: number }) => tableService.bulkCategory(ids, catId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["groupedTables"] });
      const catName = tableCategories.find(c => c.id === variables.catId)?.name || "selected category";
      toast.success(`Moved ${variables.ids.length} tables to ${catName}`);
      setSelectedIds([]);
      setSelectMode(false);
      setShowCategoryDropdown(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update category");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => tableService.bulkDelete(ids),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groupedTables"] });
      const skippedCount = data.skippedIds?.length || 0;
      const deletedCount = selectedIds.length - skippedCount;
      if (skippedCount > 0) {
        toast.warning(`Deleted ${deletedCount} tables. ${skippedCount} occupied tables were skipped.`);
      } else {
        toast.success(`Deleted ${deletedCount} tables`);
      }
      setSelectedIds([]);
      setSelectMode(false);
      setShowDeleteConfirm(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete tables");
    }
  });

  const createTableMutation = useMutation({
    mutationFn: (table: { name: string; capacity: number; categoryId: number | null }) => tableService.create(table),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupedTables"] });
      toast.success("Table created successfully");
      setIsAddOpen(false);
      setNewTable({
        name: "",
        capacity: 4,
        categoryId: null,
      });
      setCreateError(null);
    },
    onError: (err: any) => {
      setCreateError(err.message || "Failed to create table");
    }
  });

  const createZoneMutation = useMutation({
    mutationFn: (name: string) => tableService.createTableCategory({ name, position: tableCategories.length + 1, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tableCategories"] });
      queryClient.invalidateQueries({ queryKey: ["groupedTables"] });
      toast.success("Zone created successfully");
      setNewZoneName("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create zone");
    }
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (id: number) => tableService.deleteTableCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tableCategories"] });
      queryClient.invalidateQueries({ queryKey: ["groupedTables"] });
      toast.success("Zone deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete zone");
    }
  });

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.name.trim()) {
      return setCreateError("Table number is required");
    }
    if (newTable.capacity < 1) {
      return setCreateError("Capacity must be at least 1");
    }
    createTableMutation.mutate({
      name: newTable.name,
      capacity: newTable.capacity,
      categoryId: newTable.categoryId,
    });
  };

  const toggleTableSelection = (id: number) => {
    if (!selectMode) {
      setSideTableId(id);
      return;
    }
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedTables = allTables.filter(t => selectedIds.includes(t.id));
  const canMerge = selectedIds.length >= 2 && 
    selectedTables.every(t => !t.isMerged && t.status !== "Occupied") &&
    selectedTables.every(t => t.categoryId === selectedTables[0].categoryId);

  // Find dynamic tab zones from table categories
  const zones = ["All", ...tableCategories.map(c => c.name)];

  return (
    <AppShell title="Restaurant floor" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Tables" }]}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Tabs value={zone} onValueChange={setZone}>
          <TabsList className="rounded-xl">
            {zones.map(z => <TabsTrigger key={z} value={z} className="rounded-lg">{z}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl"
            onClick={() => setIsManageZonesOpen(true)}
          >
            Manage zones
          </Button>
          <Button 
            variant={selectMode ? "default" : "outline"} 
            className="rounded-xl" 
            onClick={() => { 
              setSelectMode(!selectMode); 
              setSelectedIds([]); 
              setShowStatusDropdown(false);
              setShowCategoryDropdown(false);
              setShowDeleteConfirm(false);
            }}
          >
            <MousePointerClick className="size-4 mr-1" /> 
            {selectMode ? "Selecting…" : "Select mode"}
          </Button>
          <Button variant="outline" className="rounded-xl animate-pulse bg-primary/10 border-primary text-primary" onClick={() => setIsAddOpen(true)}>
            <Plus className="size-4 mr-1" /> Add table
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-muted/40 to-background border-dashed select-none" style={{ minHeight: 600 }}>
        {/* Floor grid outline */}
        <div className="absolute inset-6 rounded-xl border-2 border-dashed border-border pointer-events-none" />

        {/* Tables list */}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Loading tables...</div>
        ) : groupedTables.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No tables found</div>
        ) : (
          <div className="space-y-8 w-full relative z-10 p-4">
            {groupedTables
              .filter(g => zone === "All" || g.categoryName === zone)
              .map(g => {
                if (g.tables.length === 0) return null;
                return (
                  <div key={g.categoryId || 'unassigned'} className="space-y-4">
                    <h3 className="font-serif text-lg font-bold flex items-center gap-2 border-b pb-2 text-foreground/80">
                      <span>{g.categoryName}</span>
                      <span className="text-xs font-sans font-normal bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {g.tables.length} tables
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {g.tables.map(t => {
                        const isSelected = selectedIds.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => toggleTableSelection(t.id)}
                            className={cn(
                              "relative flex flex-col items-center justify-center border-2 p-6 transition-all hover:scale-105 cursor-pointer shadow-sm rounded-2xl aspect-square",
                              statusColor[t.isMerged ? "Merged" : t.status],
                              isSelected && "ring-4 ring-primary ring-offset-2 ring-offset-background",
                            )}
                          >
                            {/* QR Icon */}
                            <button
                              type="button"
                              className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQrModalTable({ id: t.id, name: t.name, qrToken: t.qrToken });
                              }}
                            >
                              <QrCode className="size-4" />
                            </button>

                            {/* Multi-select indicator */}
                            {selectMode && (
                              <div className="absolute top-2 left-2 bg-background border rounded-full size-4 flex items-center justify-center">
                                {isSelected && <div className="size-2 rounded-full bg-primary" />}
                              </div>
                            )}

                            <div className="font-serif text-2xl leading-none font-bold text-foreground">{t.name}</div>
                            <div className="text-xs opacity-80 mt-2 font-medium">Cap: {t.capacity}</div>
                            
                            {/* Merged badge */}
                            {t.isMerged && (
                              <div className="text-[10px] mt-2 px-2.5 py-0.5 rounded-full bg-special text-white font-semibold shadow-xs">
                                Merged
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] border-t border-muted/50 pt-3 mt-8 bg-background/50 backdrop-blur-xs rounded-lg px-3">
          <div className="flex gap-4 flex-wrap">
            {Object.entries(statusLegendColors).map(([k, cls]) => (
              <span key={k} className="flex items-center gap-1.5 font-medium">
                <span className={cn("size-2.5 rounded-full border", cls)} /> 
                {k}
              </span>
            ))}
          </div>
          <span className="text-muted-foreground">Click a table to manage guests or check status</span>
        </div>
      </Card>

      {/* Floating Action Bar (Select Mode UI) */}
      {selectMode && selectedIds.length >= 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="text-sm font-semibold border-r border-border pr-4 mr-2">
            {selectedIds.length} selected
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              size="sm" 
              className="rounded-xl bg-special text-white hover:bg-special/95"
              disabled={!canMerge}
              onClick={() => mergeMutation.mutate(selectedIds)}
            >
              <Combine className="size-4 mr-1" /> Merge
            </Button>

            <div className="relative">
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-xl"
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowCategoryDropdown(false);
                  setShowDeleteConfirm(false);
                }}
              >
                Change status <ChevronDown className="size-4 ml-1" />
              </Button>
              {showStatusDropdown && (
                <div className="absolute bottom-full mb-2 left-0 w-40 bg-background border border-border rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50">
                  {["Free", "Occupied", "Reserved", "Cleaning"].map((status) => (
                    <button
                      key={status}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-muted font-medium transition-colors"
                      onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status })}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-xl"
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowStatusDropdown(false);
                  setShowDeleteConfirm(false);
                }}
              >
                Change category <ChevronDown className="size-4 ml-1" />
              </Button>
              {showCategoryDropdown && (
                <div className="absolute bottom-full mb-2 left-0 w-48 max-h-56 overflow-y-auto bg-background border border-border rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50">
                  {tableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-muted font-medium transition-colors"
                      onClick={() => bulkCategoryMutation.mutate({ ids: selectedIds, catId: cat.id })}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Button 
                size="sm" 
                variant="destructive" 
                className="rounded-xl"
                onClick={() => {
                  setShowDeleteConfirm(!showDeleteConfirm);
                  setShowStatusDropdown(false);
                  setShowCategoryDropdown(false);
                }}
              >
                <Trash2 className="size-4 mr-1" /> Delete
              </Button>
              {showDeleteConfirm && (
                <div className="absolute bottom-full mb-2 right-0 w-64 bg-background border border-destructive/20 rounded-xl shadow-2xl p-4 flex flex-col gap-3 z-50">
                  <div className="text-xs text-muted-foreground flex gap-1.5 items-start">
                    <AlertTriangle className="size-4 text-destructive shrink-0" />
                    <span>Are you sure you want to delete these {selectedIds.length} tables? Occupied tables will be skipped.</span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-lg text-xs" onClick={() => bulkDeleteMutation.mutate(selectedIds)}>
                      Confirm
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            className="ml-4 p-1 hover:bg-muted rounded-full transition-colors"
            onClick={() => {
              setSelectMode(false);
              setSelectedIds([]);
              setShowStatusDropdown(false);
              setShowCategoryDropdown(false);
              setShowDeleteConfirm(false);
            }}
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Detail Popup / Sheet */}
      <Sheet open={!!sideTableId} onOpenChange={(o) => !o && setSideTableId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {sideTableId && (() => {
            const t = allTables.find(x => x.id === sideTableId);
            if (!t) return null;

            const mergedSiblings = t.mergeGroupId 
              ? allTables.filter(x => x.mergeGroupId === t.mergeGroupId && x.id !== t.id)
              : [];

            const allActiveOrders = kanbanOrders ? [
              ...(kanbanOrders.new || []),
              ...(kanbanOrders.preparing || []),
              ...(kanbanOrders.ready || []),
              ...(kanbanOrders.served || []),
            ] : [];

            const rawActiveOrder = allActiveOrders.find(o => 
              (t.isMerged && t.mergeGroupId 
                ? o.mergeGroupId === t.mergeGroupId 
                : o.tableId === t.id) && o.billStatus !== "Paid"
            );

            const activeOrder = rawActiveOrder && !rawActiveOrder.billId ? rawActiveOrder : null;
            const hasUnpaidOrder = !!rawActiveOrder;

            return (
              <>
                <SheetHeader>
                  <SheetTitle className="font-serif text-2xl flex items-center gap-2">
                    <span>{t.name}</span>
                    {mergedSiblings.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        + {mergedSiblings.map(m => m.name).join(", ")}
                      </span>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6 px-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Card className="p-3 rounded-xl">
                      <div className="text-xs text-muted-foreground">Capacity</div>
                      <div className="font-serif text-xl mt-1">
                        {t.isMerged ? (
                          <span>
                            {t.combinedCapacity || t.capacity} <span className="text-xs text-muted-foreground">(combined)</span>
                          </span>
                        ) : t.capacity}
                      </div>
                    </Card>
                    <Card className="p-3 rounded-xl">
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="font-serif text-xl mt-1 flex items-center gap-1.5">
                        <span className={cn("size-2.5 rounded-full", statusLegendColors[t.isMerged ? "Merged" : t.status])} />
                        {t.isMerged ? "Merged" : t.status}
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Manual Status Override</span>
                      {hasUnpaidOrder && (
                        <span className="text-[10px] text-destructive font-bold flex items-center gap-1 normal-case">
                          <AlertTriangle className="size-3" /> Active order pending bill
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        className={cn("rounded-xl justify-start", t.status === "Free" && !t.isMerged && "border-success bg-success/5")}
                        onClick={() => bulkStatusMutation.mutate({ ids: [t.id], status: "Free" })}
                        disabled={hasUnpaidOrder || bulkStatusMutation.isPending}
                      >
                        <span className="size-2 rounded-full bg-success mr-2" /> Free
                      </Button>
                      <Button 
                        variant="outline" 
                        className={cn("rounded-xl justify-start", t.status === "Occupied" && !t.isMerged && "border-destructive bg-destructive/5")}
                        onClick={() => bulkStatusMutation.mutate({ ids: [t.id], status: "Occupied" })}
                        disabled={hasUnpaidOrder || bulkStatusMutation.isPending}
                      >
                        <span className="size-2 rounded-full bg-destructive mr-2" /> Occupied
                      </Button>
                      <Button 
                        variant="outline" 
                        className={cn("rounded-xl justify-start", t.status === "Reserved" && !t.isMerged && "border-warning bg-warning/5")}
                        onClick={() => bulkStatusMutation.mutate({ ids: [t.id], status: "Reserved" })}
                        disabled={hasUnpaidOrder || bulkStatusMutation.isPending}
                      >
                        <span className="size-2 rounded-full bg-warning mr-2" /> Reserved
                      </Button>
                      <Button 
                        variant="outline" 
                        className={cn("rounded-xl justify-start", t.status === "Cleaning" && !t.isMerged && "border-muted bg-muted/10")}
                        onClick={() => bulkStatusMutation.mutate({ ids: [t.id], status: "Cleaning" })}
                        disabled={hasUnpaidOrder || bulkStatusMutation.isPending}
                      >
                        <span className="size-2 rounded-full bg-muted-foreground/60 mr-2" /> Cleaning
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-muted">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        className="rounded-xl bg-primary text-primary-foreground" 
                        onClick={() => {
                          bulkStatusMutation.mutate({ ids: [t.id], status: "Occupied" });
                          toast.success("Guests seated");
                        }}
                        disabled={hasUnpaidOrder}
                      >
                        Seat guests
                      </Button>
                      <Button 
                        variant="outline" 
                        className="rounded-xl" 
                        onClick={() => {
                          if (activeOrder) {
                            navigate({ to: "/orders", search: { editOrderId: activeOrder.id, tableId: undefined, mergeGroupId: undefined } });
                          } else {
                            bulkStatusMutation.mutate({ ids: [t.id], status: "Occupied" });
                            toast.success("Order started");
                            if (t.isMerged && t.mergeGroupId) {
                              navigate({ to: "/orders", search: { mergeGroupId: t.mergeGroupId, tableId: undefined, editOrderId: undefined } });
                            } else {
                              navigate({ to: "/orders", search: { tableId: t.id, mergeGroupId: undefined, editOrderId: undefined } });
                            }
                          }
                        }}
                        disabled={!!rawActiveOrder?.billId}
                      >
                        {rawActiveOrder ? (rawActiveOrder.billId ? "Bill generated" : "Edit order") : "Start order"}
                      </Button>
                    </div>
                  </div>

                  {t.isMerged && t.mergeGroupId && (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl text-special border-special/30 hover:bg-special/5" 
                      onClick={() => unmergeMutation.mutate(t.mergeGroupId!)}
                    >
                      <Split className="size-4 mr-1" /> Split / unmerge group
                    </Button>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Add Table Sheet */}
      <Sheet open={isAddOpen} onOpenChange={(isOpen) => {
        setIsAddOpen(isOpen);
        if (!isOpen) {
          setCreateError(null);
        }
      }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">Add New Table</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreateTable} className="mt-6 space-y-5 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="tableNumber">Table Number</Label>
              <Input
                id="tableNumber"
                placeholder="e.g. T-13"
                value={newTable.name}
                onChange={e => {
                  setNewTable(prev => ({ ...prev, name: e.target.value }));
                  setCreateError(null);
                }}
                required
                className="rounded-xl font-medium"
              />
              {createError && (
                <p className="text-xs text-destructive font-medium mt-1">{createError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity</Label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-xl size-10 flex items-center justify-center text-lg font-bold"
                  onClick={() => setNewTable(prev => ({ ...prev, capacity: Math.max(1, prev.capacity - 1) }))}
                >
                  -
                </Button>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={newTable.capacity}
                  onChange={e => setNewTable(prev => ({ ...prev, capacity: Math.max(1, Number(e.target.value)) }))}
                  required
                  className="rounded-xl text-center font-bold flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-xl size-10 flex items-center justify-center text-lg font-bold"
                  onClick={() => setNewTable(prev => ({ ...prev, capacity: prev.capacity + 1 }))}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category / Zone</Label>
              <select
                id="category"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring font-medium"
                value={newTable.categoryId || ""}
                onChange={e => setNewTable(prev => ({ ...prev, categoryId: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">Unassigned</option>
                {tableCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-base py-3" 
                disabled={createTableMutation.isPending}
              >
                {createTableMutation.isPending ? "Creating..." : "Create Table"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Manage Zones Sheet */}
      <Sheet open={isManageZonesOpen} onOpenChange={setIsManageZonesOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl">Manage Zones</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6 px-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newZoneName.trim()) return;
                createZoneMutation.mutate(newZoneName.trim());
              }} 
              className="space-y-3"
            >
              <Label htmlFor="zoneName">Add New Zone</Label>
              <div className="flex gap-2">
                <Input
                  id="zoneName"
                  placeholder="e.g. Patio, Rooftop"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="rounded-xl font-medium flex-1"
                />
                <Button 
                  type="submit" 
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
                  disabled={createZoneMutation.isPending}
                >
                  {createZoneMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </div>
            </form>

            <div className="border-t border-muted pt-4 space-y-3">
              <Label>Active Zones</Label>
              {tableCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active zones. Tables will be Unassigned.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {tableCategories.map(cat => (
                    <div 
                      key={cat.id} 
                      className="flex items-center justify-between p-3 rounded-xl border border-muted bg-muted/20"
                    >
                      <span className="font-medium text-sm">{cat.name}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive size-8 p-0"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the zone "${cat.name}"? Tables in this zone will be set to Unassigned.`)) {
                            deleteZoneMutation.mutate(cat.id);
                          }
                        }}
                        disabled={deleteZoneMutation.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* QR Modal popup */}
      {qrModalTable && (
        <TableQrModal
          tableId={qrModalTable.id}
          tableName={qrModalTable.name}
          qrToken={qrModalTable.qrToken}
          open={!!qrModalTable}
          onClose={() => setQrModalTable(null)}
        />
      )}
    </AppShell>
  );
}
