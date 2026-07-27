import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Flag, ChefHat, Clock, Send, X, Trash2, Edit2, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingService } from "@/api/services/billingService";
import { orderService } from "@/api/services/orderService";
import { menuService } from "@/api/services/menuService";
import { tableService } from "@/api/services/tableService";
import { OrderDto, CreateOrderDto, CreateOrderItemDto, UpdateOrderItemDto, OrderItemDto } from "@/types/models";
import { BASE_URL } from "@/api/apiClient";
import { getTaxSettings } from "@/lib/taxSettings";
import * as signalR from "@microsoft/signalr";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/orders")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tableId: search.tableId ? Number(search.tableId) : undefined,
      mergeGroupId: search.mergeGroupId ? Number(search.mergeGroupId) : undefined,
      editOrderId: search.editOrderId ? Number(search.editOrderId) : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Orders — Aurelia" }, { name: "description", content: "Dine-in, room service and parcel orders with a live kitchen board." }] }),
  component: OrdersPage,
});

const columns = ["New", "Preparing", "Ready", "Served"] as const;

function OrdersPage() {
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [kds, setKds] = useState(false);
  const [sourceTab, setSourceTab] = useState("Dine-in");
  const [activeMenuCat, setActiveMenuCat] = useState<number | null>(null);

  // Cart Local State
  const [cart, setCart] = useState<{ menuItemId: number; name: string; qty: number; price: number }[]>([]);
  const [editingOrderItems, setEditingOrderItems] = useState<OrderItemDto[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isPriorityOrder, setIsPriorityOrder] = useState(false);

  // Dine-in selected table/merge group
  const [selectedTableOption, setSelectedTableOption] = useState<{ tableId?: number; mergeGroupId?: number; label: string } | null>(null);

  // Room Service details
  const [roomNumber, setRoomNumber] = useState("");

  // Parcel details
  const [customerName, setCustomerName] = useState("");

  // Edit Order modal state
  const [editingOrder, setEditingOrder] = useState<OrderDto | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCartAdditions, setEditCartAdditions] = useState<{ menuItemId: number; name: string; qty: number; price: number }[]>([]);

  // SignalR connection reference
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const mappedOrderType = (tab: string) => {
    if (tab === "Dine-in") return "DineIn";
    if (tab === "Room Service") return "RoomService";
    return "Parcel";
  };

  // Queries
  const { data: kanbanData = { new: [], preparing: [], ready: [], served: [] }, isLoading: isKanbanLoading } = useQuery({
    queryKey: ["kanbanOrders", sourceTab],
    queryFn: () => orderService.getKanban(mappedOrderType(sourceTab))
  });

  const { data: menuGrouped = [], isLoading: isMenuLoading } = useQuery({
    queryKey: ["menuGrouped"],
    queryFn: menuService.getGrouped
  });

  const { data: tables = [] } = useQuery({
    queryKey: ["allTables"],
    queryFn: tableService.getAll
  });

  const allActiveOrdersForEdit = kanbanData ? [
    ...(kanbanData.new || []),
    ...(kanbanData.preparing || []),
    ...(kanbanData.ready || []),
    ...(kanbanData.served || []),
  ] : [];

  const activeOrder = selectedTableOption && sourceTab === "Dine-in"
    ? allActiveOrdersForEdit.find(o =>
      (selectedTableOption.mergeGroupId
        ? o.mergeGroupId === selectedTableOption.mergeGroupId
        : o.tableId === selectedTableOption.tableId) && !o.billId
    )
    : null;

  useEffect(() => {
    if (activeOrder) {
      setEditingOrderItems(activeOrder.items);
      setSpecialInstructions(activeOrder.specialInstructions || "");
      setIsPriorityOrder(activeOrder.isPriority);
    } else {
      setEditingOrderItems([]);
      setSpecialInstructions("");
      setIsPriorityOrder(false);
    }
  }, [activeOrder?.id]);

  // Auto-select table from URL search parameters
  useEffect(() => {
    if (tables.length > 0) {
      if (search.mergeGroupId) {
        const siblings = tables.filter(s => s.mergeGroupId === search.mergeGroupId);
        if (siblings.length > 0) {
          const names = siblings.map(s => s.name).sort((a, b) => a.localeCompare(b)).join("+");
          setSelectedTableOption({
            label: `Table ${names}`,
            mergeGroupId: search.mergeGroupId
          });
          setSourceTab("Dine-in");
        }
      } else if (search.tableId) {
        const table = tables.find(t => t.id === search.tableId);
        if (table) {
          setSelectedTableOption({
            label: `Table ${table.name}`,
            tableId: search.tableId
          });
          setSourceTab("Dine-in");
        }
      }
    }
  }, [search.tableId, search.mergeGroupId, tables]);

  // Auto-select table and switch to Dine-in if editOrderId is passed in search params
  useEffect(() => {
    if (search.editOrderId && kanbanData && tables.length > 0) {
      const allOrders = [
        ...(kanbanData.new || []),
        ...(kanbanData.preparing || []),
        ...(kanbanData.ready || []),
        ...(kanbanData.served || []),
      ];
      const match = allOrders.find(o => o.id === search.editOrderId);
      if (match && match.type === "DineIn") {
        setSourceTab("Dine-in");
        if (match.mergeGroupId) {
          const siblings = tables.filter(s => s.mergeGroupId === match.mergeGroupId);
          const names = siblings.map(s => s.name).sort((a, b) => a.localeCompare(b)).join("+");
          setSelectedTableOption({
            label: `Table ${names}`,
            mergeGroupId: match.mergeGroupId
          });
        } else if (match.tableId) {
          const table = tables.find(t => t.id === match.tableId);
          if (table) {
            setSelectedTableOption({
              label: `Table ${table.name}`,
              tableId: match.tableId
            });
          }
        }
      }
    }
  }, [search.editOrderId, kanbanData, tables]);

  // SignalR Setup
  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/kitchen`)
      .withAutomaticReconnect()
      .build();

    conn.on("NewOrder", () => {
      queryClient.invalidateQueries({ queryKey: ["kanbanOrders"] });
    });

    conn.on("OrderStatusChanged", () => {
      queryClient.invalidateQueries({ queryKey: ["kanbanOrders"] });
    });

    conn.on("OrderUpdated", () => {
      queryClient.invalidateQueries({ queryKey: ["kanbanOrders"] });
    });

    conn.start()
      .then(() => {
        conn.invoke("JoinKitchenGroup");
      })
      .catch(err => console.error("SignalR Connection Error: ", err));

    connectionRef.current = conn;

    return () => {
      if (connectionRef.current) {
        connectionRef.current.invoke("LeaveKitchenGroup")
          .then(() => connectionRef.current?.stop())
          .catch(err => console.error(err));
      }
    };
  }, [queryClient]);

  // Set default category when menu loads
  useEffect(() => {
    if (menuGrouped.length > 0 && activeMenuCat === null) {
      setActiveMenuCat(menuGrouped[0].categoryId);
    }
  }, [menuGrouped, activeMenuCat]);

  // Table options combining merged tables
  const getTableOptions = () => {
    const options: { label: string; tableId?: number; mergeGroupId?: number }[] = [];
    const processedMergeGroups = new Set<number>();

    tables.forEach(t => {
      if (t.isMerged && t.mergeGroupId) {
        if (!processedMergeGroups.has(t.mergeGroupId)) {
          processedMergeGroups.add(t.mergeGroupId);
          const siblings = tables.filter(s => s.mergeGroupId === t.mergeGroupId);
          const names = siblings.map(s => s.name).sort((a, b) => a.localeCompare(b)).join("+");
          options.push({
            label: `Table ${names}`,
            mergeGroupId: t.mergeGroupId
          });
        }
      } else if (!t.isMerged) {
        options.push({
          label: `Table ${t.name}`,
          tableId: t.id
        });
      }
    });
    return options.sort((a, b) => a.label.localeCompare(b.label));
  };

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: (order: CreateOrderDto) => orderService.create(order),
    onSuccess: () => {
      toast.success("Order sent to kitchen successfully");
      setCart([]);
      setSpecialInstructions("");
      setIsPriorityOrder(false);
      setSelectedTableOption(null);
      setRoomNumber("");
      setCustomerName("");
      queryClient.invalidateQueries({ queryKey: ["kanbanOrders"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit order");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => orderService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanbanOrders"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update order status");
    }
  });

  const acknowledgeAddOnsMutation = useMutation({
    mutationFn: (id: number) => orderService.acknowledgeAddOns(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanbanOrders"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to acknowledge items");
    }
  });

  const editOrderItemsMutation = useMutation({
    mutationFn: ({ id, items }: { id: number; items: UpdateOrderItemDto[] }) => orderService.updateItems(id, items),
    onSuccess: () => {
      toast.success("Order updated successfully");
      setCart([]);
      if (search.editOrderId) {
        navigate({ to: "/orders", search: { ...search, editOrderId: undefined } });
      }
      queryClient.invalidateQueries({ queryKey: ["kanbanOrders"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update order");
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (id: number) => orderService.cancel(id),
    onSuccess: () => {
      toast.success("Order cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["kanbanOrders"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel order");
    }
  });

  const generateBillMutation = useMutation({
    mutationFn: (id: number) => {
      const tax = getTaxSettings();
      return billingService.generateBill({
        orderId: id,
        serviceChargePercent: tax.serviceChargePercent,
        taxPercent: tax.taxPercent
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanbanOrders"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      setSelectedTableOption(null);
      setCart([]);
      toast.success("Bill generated successfully! Check the Billing page.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate bill");
    }
  });

  const addToCart = (item: { id: number; name: string; price: number }) => {
    setCart(prev => {
      const match = prev.find(i => i.menuItemId === item.id);
      if (match) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, qty: 1, price: item.price }];
    });
  };

  const handleSendToKitchen = () => {
    if (activeOrder) {
      if (cart.length === 0 && JSON.stringify(editingOrderItems) === JSON.stringify(activeOrder.items)) {
        return toast.error("No changes made to update.");
      }

      const payloadItems: UpdateOrderItemDto[] = [
        ...editingOrderItems.map(i => ({
          id: i.id,
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          priceAtOrder: i.priceAtOrder,
          status: i.status,
          isAddOn: i.isAddOn
        })),
        ...cart.map(i => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.qty,
          priceAtOrder: i.price,
          status: "Active",
          isAddOn: true
        }))
      ];

      editOrderItemsMutation.mutate({ id: activeOrder.id, items: payloadItems });
    } else {
      if (cart.length === 0) {
        return toast.error("Your cart is empty.");
      }

      const payload: CreateOrderDto = {
        type: mappedOrderType(sourceTab),
        isPriority: isPriorityOrder,
        specialInstructions: specialInstructions.trim() || null,
        items: cart.map(i => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.qty,
          priceAtOrder: i.price,
          isAddOn: false
        }))
      };

      if (sourceTab === "Dine-in") {
        if (!selectedTableOption) {
          return toast.error("Please select a table option.");
        }
        payload.tableId = selectedTableOption.tableId || null;
        payload.mergeGroupId = selectedTableOption.mergeGroupId || null;
      } else if (sourceTab === "Room Service") {
        if (!roomNumber.trim()) {
          return toast.error("Please enter a room number.");
        }
        payload.roomNumber = roomNumber.trim();
      } else {
        if (!customerName.trim()) {
          return toast.error("Please enter customer name.");
        }
        payload.customerName = customerName.trim();
      }

      createOrderMutation.mutate(payload);
    }
  };

  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);

  // Edit modal actions
  const handleOpenEdit = (order: OrderDto) => {
    navigate({ to: "/orders", search: { ...search, editOrderId: order.id } });
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingOrder(null);
    setEditCartAdditions([]);
    if (search.editOrderId) {
      navigate({ to: "/orders", search: { ...search, editOrderId: undefined } });
    }
  };

  const handleSaveEdit = () => {
    if (!editingOrder) return;

    const payloadItems: UpdateOrderItemDto[] = [
      ...editingOrder.items.map(i => ({
        id: i.id,
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        priceAtOrder: i.priceAtOrder,
        status: i.status,
        isAddOn: i.isAddOn
      })),
      ...editCartAdditions.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.qty,
        priceAtOrder: i.price,
        status: "Active",
        isAddOn: true
      }))
    ];

    editOrderItemsMutation.mutate({ id: editingOrder.id, items: payloadItems });
  };

  const handleCancelItemInEdit = (itemId: number) => {
    if (!editingOrder) return;
    setEditingOrder({
      ...editingOrder,
      items: editingOrder.items.map(i => i.id === itemId ? { ...i, status: "Cancelled" } : i)
    });
  };

  return (
    <AppShell title={kds ? "Kitchen display" : "Orders"} breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Orders" }]}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b border-muted pb-4">
        <Tabs value={sourceTab} onValueChange={(v) => { setSourceTab(v); setCart([]); }}>
          <TabsList className="rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="Dine-in" className="rounded-lg px-4 py-2 font-medium">Dine-in</TabsTrigger>
            <TabsTrigger value="Room Service" className="rounded-lg px-4 py-2 font-medium">Room service</TabsTrigger>
            <TabsTrigger value="Parcel" className="rounded-lg px-4 py-2 font-medium">Parcel</TabsTrigger>
          </TabsList>
        </Tabs>
        <label className="flex items-center gap-2.5 text-sm font-semibold select-none cursor-pointer">
          <Switch checked={kds} onCheckedChange={setKds} />
          Kitchen display mode
        </label>
      </div>

      {!kds && (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 mb-8 animate-in fade-in duration-300">
          {/* Menu Picker Area */}
          <Card className="p-6 rounded-2xl bg-sidebar/30 border border-border/40">
            {isMenuLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading menu...</div>
            ) : (
              <Tabs value={activeMenuCat?.toString()} onValueChange={(v) => setActiveMenuCat(Number(v))}>
                <TabsList className="rounded-xl flex-wrap h-auto bg-muted/30 p-1 mb-4 gap-1">
                  {menuGrouped.map(cat => (
                    <TabsTrigger key={cat.categoryId} value={cat.categoryId.toString()} className="rounded-lg">
                      {cat.categoryName}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {menuGrouped.map(cat => (
                  <TabsContent key={cat.categoryId} value={cat.categoryId.toString()} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                    {cat.items.map(item => (
                      <Card key={item.id} className="p-0 rounded-2xl overflow-hidden border border-border/40 bg-background/50 hover:border-primary/50 transition-colors flex flex-col">
                        <div className="h-28 overflow-hidden relative">
                          <img
                            src={item.image ? (item.image.startsWith("http") ? item.image : `${BASE_URL}${item.image}`) : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className={cn("absolute top-2 left-2 size-4.5 rounded-full border bg-background/90 flex items-center justify-center border-border", item.veg ? "border-success" : "border-destructive")}>
                            <span className={cn("block size-2 rounded-full", item.veg ? "bg-success" : "bg-destructive")} />
                          </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-sm font-semibold leading-snug line-clamp-1 text-foreground">{item.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-muted/50">
                            <span className="text-sm font-bold text-foreground">${item.price}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0 rounded-xl hover:bg-primary hover:text-white transition-colors border border-border"
                              onClick={() => addToCart({ id: item.id!, name: item.name, price: item.price })}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </Card>

          {/* Cart Sidebar Area */}
          <Card className="p-6 rounded-2xl border border-border/40 bg-sidebar/30 flex flex-col h-fit sticky top-24">
            <div className="font-serif text-xl font-bold flex items-center justify-between text-foreground">
              <span>Cart</span>
              <span className="text-xs font-sans font-normal text-muted-foreground">{cart.length} items</span>
            </div>

            {/* Target Selectors */}
            <div className="mt-4 space-y-3.5 border-b border-muted pb-4 mb-4">
              {sourceTab === "Dine-in" && (
                <div className="space-y-1.5">
                  <Label htmlFor="dineinTable">Select Table</Label>
                  <select
                    id="dineinTable"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 font-medium"
                    value={selectedTableOption ? (selectedTableOption.mergeGroupId ? `group-${selectedTableOption.mergeGroupId}` : `table-${selectedTableOption.tableId}`) : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setSelectedTableOption(null);
                      } else if (val.startsWith("group-")) {
                        const groupId = Number(val.replace("group-", ""));
                        const opt = getTableOptions().find(o => o.mergeGroupId === groupId);
                        setSelectedTableOption(opt || null);
                      } else {
                        const tableId = Number(val.replace("table-", ""));
                        const opt = getTableOptions().find(o => o.tableId === tableId);
                        setSelectedTableOption(opt || null);
                      }
                    }}
                  >
                    <option value="">-- Choose Table --</option>
                    {getTableOptions().map((opt, i) => (
                      <option
                        key={i}
                        value={opt.mergeGroupId ? `group-${opt.mergeGroupId}` : `table-${opt.tableId}`}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sourceTab === "Room Service" && (
                <div className="space-y-1.5">
                  <Label htmlFor="roomNum">Room Number</Label>
                  <Input
                    id="roomNum"
                    placeholder="e.g. 305"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    className="rounded-xl font-medium"
                  />
                </div>
              )}

              {sourceTab === "Parcel" && (
                <div className="space-y-1.5">
                  <Label htmlFor="custName">Customer Name</Label>
                  <Input
                    id="custName"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="rounded-xl font-medium"
                  />
                </div>
              )}
            </div>

            {/* Cart Items List */}
            {activeOrder && editingOrderItems.length > 0 && (
              <div className="mb-4 border-b border-muted pb-4">
                <div className="text-xs font-semibold text-orange-600 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>Placed Items ({activeOrder.orderNumber})</span>
                  {activeOrder.status === "New" && (
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground hover:text-foreground font-semibold normal-case underline"
                      onClick={() => {
                        setSelectedTableOption(null);
                        setCart([]);
                        if (search.editOrderId) {
                          navigate({ to: "/orders", search: { ...search, editOrderId: undefined } });
                        }
                      }}
                    >
                      Deselect
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {editingOrderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm pb-2 border-b border-muted/30 last:border-0 last:pb-0">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className={cn("font-semibold text-foreground truncate", item.status === "Cancelled" && "line-through text-destructive")}>
                          {item.quantity}× {item.name}
                          {item.isAddOn && <span className="ml-1 text-[9px] px-1 py-0.2 rounded-md bg-orange-600/15 text-orange-600 font-extrabold uppercase">Add-on</span>}
                          {item.status === "Cancelled" && <span className="ml-1 text-[9px] px-1 py-0.2 rounded-md bg-destructive/15 text-destructive font-extrabold uppercase">Cancelled</span>}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">${item.priceAtOrder} each</div>
                      </div>
                      {item.status === "Active" && activeOrder.status === "New" && (
                        <button
                          className="size-7 rounded-lg hover:bg-destructive/10 text-destructive flex items-center justify-center transition-colors"
                          onClick={() => {
                            setEditingOrderItems(prev => prev.map(x => x.id === item.id ? { ...x, status: "Cancelled" } : x));
                          }}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              {activeOrder ? "Add New Items" : "Items in Cart"}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <ChefHat className="size-8 opacity-40 animate-bounce" />
                <span>{activeOrder ? "Add menu items above." : "Your cart is empty."}</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm pb-2 border-b border-muted/50 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-semibold text-foreground truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground font-medium">${item.price} each</div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        className="size-7 rounded-lg bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors"
                        onClick={() => setCart(c => c.map((x, xi) => xi === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-foreground">{item.qty}</span>
                      <button
                        className="size-7 rounded-lg bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors"
                        onClick={() => setCart(c => c.map((x, xi) => xi === idx ? { ...x, qty: x.qty + 1 } : x))}
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        className="size-7 rounded-lg hover:bg-destructive/10 text-destructive flex items-center justify-center transition-colors"
                        onClick={() => setCart(c => c.filter((_, xi) => xi !== idx))}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-muted">
              <Input
                placeholder="Special instructions…"
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                className="rounded-xl font-medium"
              />

              <label className="flex items-center gap-2 text-xs font-semibold select-none cursor-pointer text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isPriorityOrder}
                  onChange={e => setIsPriorityOrder(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4"
                />
                Mark as high-priority order
              </label>

              <div className="space-y-1.5 text-xs text-muted-foreground border-t border-muted/50 pt-3">
                {activeOrder && (
                  <>
                    <div className="flex justify-between">
                      <span>Placed Items</span>
                      <span>${editingOrderItems.filter(i => i.status !== "Cancelled").reduce((s, i) => s + i.quantity * i.priceAtOrder, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Additions</span>
                      <span>${cart.reduce((s, i) => s + i.qty * i.price, 0)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-base font-bold text-foreground pt-1.5 border-t border-dashed border-muted">
                  <span>{activeOrder ? "New Total" : "Subtotal"}</span>
                  <span>${(activeOrder
                    ? editingOrderItems.filter(i => i.status !== "Cancelled").reduce((s, i) => s + i.quantity * i.priceAtOrder, 0) + cart.reduce((s, i) => s + i.qty * i.price, 0)
                    : cart.reduce((s, i) => s + i.qty * i.price, 0)
                  )}</span>
                </div>
              </div>

              <Button
                className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 shadow-md"
                onClick={handleSendToKitchen}
                disabled={
                  activeOrder
                    ? editOrderItemsMutation.isPending || (cart.length === 0 && JSON.stringify(editingOrderItems) === JSON.stringify(activeOrder.items))
                    : createOrderMutation.isPending || cart.length === 0
                }
              >
                <Send className="size-4 mr-1.5" /> {activeOrder ? "Update order" : "Send to kitchen"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Kanban Board */}
      <div className={cn("grid gap-5", kds ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4")}>
        {columns.map(col => {
          const key = col.toLowerCase() as keyof typeof kanbanData;
          let items = kanbanData[key] || [];
          
          if (col === "Served") {
            items = [...items].sort((a, b) => {
              const getPriority = (o: any) => {
                if (o.billStatus === "Paid") return 2;
                if (o.billId && o.billStatus === "Pending") return 1;
                return 0; // Not generated
              };
              return getPriority(a) - getPriority(b);
            });
          }

          return (
            <div key={col} className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-muted/80">
                <span className={cn("font-serif tracking-widest uppercase font-bold text-foreground/95", kds ? "text-lg" : "text-sm")}>
                  {col}
                </span>
                <span className="text-xs bg-muted text-muted-foreground font-sans px-2.5 py-0.5 rounded-full font-bold">
                  {items.length}
                </span>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {items.map(o => (
                  <OrderCard
                    key={o.id}
                    o={o}
                    kds={kds}
                    onEdit={handleOpenEdit}
                    onCancel={() => cancelOrderMutation.mutate(o.id)}
                    onStatusChange={(status) => updateStatusMutation.mutate({ id: o.id, status })}
                    onAcknowledge={() => acknowledgeAddOnsMutation.mutate(o.id)}
                    onGenerateBill={() => generateBillMutation.mutate(o.id)}
                    isPending={updateStatusMutation.isPending || cancelOrderMutation.isPending}
                  />
                ))}
                {items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-xs text-muted-foreground bg-sidebar/5">
                    <ChefHat className="size-7 mx-auto opacity-40 mb-2.5" />
                    No {col.toLowerCase()} orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Order Modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => { if (!open) handleCloseEditModal(); }}>
        <DialogContent className="max-w-xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Edit Order {editingOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>

          {editingOrder && (
            <div className="space-y-5 mt-4">
              {/* Existing Items */}
              <div className="space-y-2">
                <Label>Current Items</Label>
                <div className="border border-muted rounded-xl p-3 bg-muted/10 space-y-2 max-h-48 overflow-y-auto">
                  {editingOrder.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b last:border-b-0 border-muted/50">
                      <span className={cn("font-medium", item.status === "Cancelled" && "line-through text-destructive")}>
                        {item.quantity}× {item.name}
                        {item.isAddOn && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-orange-600/10 text-orange-600 border border-orange-600/20 font-semibold">Add-on</span>}
                        {item.status === "Cancelled" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold">Cancelled</span>}
                      </span>
                      {item.status === "Active" && editingOrder.status === "New" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancelItemInEdit(item.id)}
                        >
                          <Trash2 className="size-4.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Items section inside modal */}
              <div className="space-y-2 pt-2 border-t border-muted">
                <Label>Add More Items (Add-ons)</Label>
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-1">
                  {menuGrouped.flatMap(c => c.items).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border text-xs bg-background">
                      <span className="font-semibold text-foreground truncate pr-1">{item.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="size-6 p-0 rounded"
                        onClick={() => {
                          setEditCartAdditions(prev => {
                            const match = prev.find(i => i.menuItemId === item.id);
                            if (match) {
                              return prev.map(i => i.menuItemId === item.id ? { ...i, qty: i.qty + 1 } : i);
                            }
                            return [...prev, { menuItemId: item.id!, name: item.name, qty: 1, price: item.price }];
                          });
                        }}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additions list */}
              {editCartAdditions.length > 0 && (
                <div className="space-y-2">
                  <Label>Pending Add-ons</Label>
                  <div className="border border-primary/20 rounded-xl p-3 bg-primary/5 space-y-2">
                    {editCartAdditions.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{item.qty}× {item.name} (${item.price} each)</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            className="size-5 rounded bg-muted flex items-center justify-center text-foreground"
                            onClick={() => setEditCartAdditions(c => c.map((x, xi) => xi === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-4 text-center font-bold">{item.qty}</span>
                          <button
                            className="size-5 rounded bg-muted flex items-center justify-center text-foreground"
                            onClick={() => setEditCartAdditions(c => c.map((x, xi) => xi === idx ? { ...x, qty: x.qty + 1 } : x))}
                          >
                            <Plus className="size-3" />
                          </button>
                          <button
                            className="size-5 text-destructive ml-1"
                            onClick={() => setEditCartAdditions(c => c.filter((_, xi) => xi !== idx))}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleCloseEditModal}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
              onClick={handleSaveEdit}
              disabled={editOrderItemsMutation.isPending}
            >
              {editOrderItemsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function OrderCard({
  o,
  kds,
  onEdit,
  onCancel,
  onStatusChange,
  onAcknowledge,
  onGenerateBill,
  isPending
}: {
  o: OrderDto;
  kds: boolean;
  onEdit: (order: OrderDto) => void;
  onCancel: () => void;
  onStatusChange: (status: string) => void;
  onAcknowledge: () => void;
  onGenerateBill?: () => void;
  isPending: boolean;
}) {
  const getElapsedMinutes = (createdAtStr: string) => {
    const dateStr = createdAtStr.endsWith('Z') ? createdAtStr : `${createdAtStr}Z`;
    const elapsed = Math.max(0, Date.now() - new Date(dateStr).getTime());
    return `${Math.floor(elapsed / 60000)}m`;
  };

  const [timeStr, setTimeStr] = useState(getElapsedMinutes(o.createdAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(getElapsedMinutes(o.createdAt));
    }, 30000);
    return () => clearInterval(timer);
  }, [o.createdAt]);

  const locationLabel = () => {
    if (o.type === "DineIn") return o.tableName || "Table --";
    if (o.type === "RoomService") return `Room ${o.roomNumber}`;
    return o.parcelCode || "Parcel";
  };

  const statusPillColor = (status: string) => {
    if (status === "New") return "bg-blue-600/20 border-blue-600 text-blue-500";
    if (status === "Preparing") return "bg-warning/20 border-warning text-warning";
    if (status === "Ready") return "bg-success/20 border-success text-success";
    return "bg-muted border-muted-foreground/30 text-muted-foreground";
  };

  return (
    <Card
      className={cn(
        "rounded-2xl p-5 border relative bg-background/50 backdrop-blur-xs flex flex-col justify-between transition-shadow shadow-sm hover:shadow-md",
        o.isPriority ? "border-destructive/40 bg-destructive/5" : "border-border/60",
        o.hasNewAddOns && "ring-2 ring-orange-500 animate-pulse border-orange-500"
      )}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className={cn("font-serif font-bold text-foreground", kds ? "text-2xl" : "text-lg")}>
              {o.orderNumber}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
              <span className="capitalize">{o.type === "DineIn" ? "Dine-in" : o.type === "RoomService" ? "Room Service" : "Parcel"}</span>
              <span>·</span>
              <span>{locationLabel()}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", statusPillColor(o.status))}>
              {o.status}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
              <Clock className="size-3.5" /> {timeStr}
            </span>
            {o.isPriority && (
              <span className="flex items-center gap-1 text-[10px] text-destructive uppercase tracking-wider font-extrabold">
                <Flag className="size-3 fill-destructive" /> Priority
              </span>
            )}
          </div>
        </div>

        {/* Addons Alert Badge */}
        {o.hasNewAddOns && (
          <button
            onClick={onAcknowledge}
            className="mt-3 w-full bg-orange-600/10 border border-orange-600/20 text-orange-600 hover:bg-orange-600/20 transition-colors text-[10px] font-extrabold uppercase py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="size-3.5" />
            New items added (Tap to Acknowledge)
          </button>
        )}

        {/* Items List */}
        <div className="mt-4 space-y-2 border-t border-muted/50 pt-3">
          {o.items.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "flex justify-between text-sm",
                item.status === "Cancelled" && "line-through text-destructive/70"
              )}
            >
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span>{item.quantity}× {item.name}</span>
                {item.isAddOn && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-orange-600/20 bg-orange-600/10 text-orange-600 font-extrabold uppercase">
                    Add-on
                  </span>
                )}
                {item.status === "Cancelled" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-extrabold uppercase">
                    Cancelled
                  </span>
                )}
              </span>
              <span className="text-muted-foreground font-semibold">${item.priceAtOrder}</span>
            </div>
          ))}
        </div>

        {o.specialInstructions && (
          <div className="mt-3 text-xs italic text-muted-foreground bg-muted/10 p-2 rounded-lg border border-border/20">
            Note: {o.specialInstructions}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3 border-t border-muted/50">
        {kds ? (
          <div className="grid grid-cols-1 gap-2">
            {o.status === "New" && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold border-muted"
                  onClick={() => onStatusChange("Preparing")}
                  disabled={isPending}
                >
                  Start preparing
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl text-xs font-bold bg-success text-white hover:bg-success/95"
                  onClick={() => onStatusChange("Ready")}
                  disabled={isPending}
                >
                  Mark ready
                </Button>
              </div>
            )}
            {o.status === "Preparing" && (
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold bg-success text-white hover:bg-success/95 w-full"
                onClick={() => onStatusChange("Ready")}
                disabled={isPending}
              >
                Mark ready
              </Button>
            )}
            {o.status === "Ready" && (
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground w-full"
                onClick={() => onStatusChange("Served")}
                disabled={isPending}
              >
                Mark served
              </Button>
            )}
            {o.status === "Served" && (
              <div className="flex flex-col gap-2">
                {(() => {
                  if (o.billStatus === "Paid") {
                    return (
                      <p className="text-xs text-success text-center font-bold uppercase tracking-wider">
                        Paid & Completed
                      </p>
                    );
                  }
                  if (o.billId && o.billStatus === "Pending") {
                    return (
                      <p className="text-xs text-warning text-center font-bold uppercase tracking-wider py-2">
                        Bill is generated
                      </p>
                    );
                  }
                  return (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs font-bold border-primary text-primary w-full hover:bg-primary/10"
                      onClick={onGenerateBill}
                      disabled={isPending}
                    >
                      Generate Bill
                    </Button>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {o.status === "Served" && (() => {
              if (o.billStatus === "Paid") {
                return (
                  <p className="text-xs text-success text-center font-bold uppercase tracking-wider py-1.5">
                    Paid & Completed
                  </p>
                );
              }
              if (o.billId && o.billStatus === "Pending") {
                return (
                  <p className="text-xs text-warning text-center font-bold uppercase tracking-wider py-1.5">
                    Bill is generated
                  </p>
                );
              }
              return (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold border-primary text-primary w-full hover:bg-primary/10"
                  onClick={onGenerateBill}
                  disabled={isPending}
                >
                  Generate Bill
                </Button>
              );
            })()}
            {!o.billId && o.billStatus !== "Paid" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg flex-1 text-xs font-bold border-muted hover:bg-muted"
                  onClick={() => onEdit(o)}
                >
                  <Edit2 className="size-3 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-destructive hover:bg-destructive/10 text-xs font-bold"
                  onClick={onCancel}
                  disabled={o.status !== "New" || isPending}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
