import { createFileRoute } from "@tanstack/react-router";
import * as signalR from "@microsoft/signalr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Plus, Minus, ChefHat, Clock, ShoppingBag, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn, getImageUrl } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { orderService } from "@/api/services/orderService";
import { menuService } from "@/api/services/menuService";
import { tableService } from "@/api/services/tableService";
import { settingsService } from "@/api/services/settingsService";
import { BASE_URL } from "@/api/apiClient";
import { CreateOrderDto } from "@/types/models";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/order/$token")({
  head: ({ params }) => ({ meta: [{ title: `Table Ordering — Aurelia` }, { name: "description", content: "Self-order menu from your table." }] }),
  component: CustomerOrderingPage,
});

function CustomerOrderingPage() {
  const { token } = Route.useParams();
  const [activeMenuCat, setActiveMenuCat] = useState<number | null>(null);
  const [cart, setCart] = useState<{ menuItemId: number; name: string; qty: number; price: number }[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isOrdered, setIsOrdered] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("New");
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Queries
  const { data: table, isLoading: isTableLoading, isError: isTableError, error: tableError } = useQuery({
    queryKey: ["resolveTable", token],
    queryFn: () => tableService.resolveByQrToken(token),
    retry: false
  });

  // Resume active order if it already exists
  useEffect(() => {
    if (table?.activeOrderId) {
      setPlacedOrderId(table.activeOrderId);
      setPlacedOrderNumber(table.activeOrderNumber || "");
      setOrderStatus(table.activeOrderStatus || "New");
      setIsOrdered(true);
    }
  }, [table]);

  const { data: menuGrouped = [], isLoading: isMenuLoading } = useQuery({
    queryKey: ["menuGroupedCustomer"],
    queryFn: menuService.getGrouped
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.getGeneralSettings(),
    staleTime: 1000 * 60 * 5,
  });

  const currencyStr = settings?.currency || "$";
  const currencySymbolMatch = currencyStr.match(/\(([^)]+)\)/);
  const displayCurrency = currencySymbolMatch ? currencySymbolMatch[1] : currencyStr;

  useEffect(() => {
    if (menuGrouped.length > 0 && activeMenuCat === null) {
      setActiveMenuCat(menuGrouped[0].categoryId);
    }
  }, [menuGrouped, activeMenuCat]);

  // Place Order Mutation
  const placeOrderMutation = useMutation({
    mutationFn: (order: CreateOrderDto) => orderService.create(order),
    onSuccess: (data: any) => {
      setPlacedOrderNumber(data.orderNumber);
      setPlacedOrderId(data.id);
      setOrderStatus(data.status || "New");
      setIsOrdered(true);
      setCart([]);
      setIsCartOpen(false);
      toast.success("Order received! The kitchen is now preparing your food.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit order. Please ask a server.");
    }
  });

  // SignalR for live status updates
  useEffect(() => {
    if (!placedOrderId) return;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/kitchenHub`)
      .withAutomaticReconnect()
      .build();

    conn.start().catch(err => console.error("SignalR Customer Order Error: ", err));

    conn.on("OrderStatusChanged", (id: number, status: string) => {
      if (id === placedOrderId) {
        setOrderStatus(status);
        if (status === "Ready") {
          toast.success("Your food is ready!");
        } else if (status === "Served") {
          toast.success("Your food has been served. Enjoy!");
        }
      }
    });

    conn.on("OrderUpdated", (order: any) => {
       if (order.id === placedOrderId) {
          setOrderStatus(order.status);
       }
    });

    return () => {
      conn.stop();
    };
  }, [placedOrderId]);

  if (isTableLoading) {
    return (
      <div className="min-h-screen bg-[#070e17] text-foreground flex flex-col items-center justify-center p-6 gap-3">
        <ChefHat className="size-12 text-primary animate-pulse" />
        <p className="text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">Locating your table...</p>
      </div>
    );
  }

  if (isTableError || !table) {
    const err = tableError as any;
    const isConflict = err?.status === 409 || err?.message?.includes("bill") || err?.message?.includes("unavailable");
    const errorMessage = err?.message || "We couldn't resolve this table's QR code. Please scan the QR code located on your table again.";
    
    return (
      <div className="min-h-screen bg-[#070e17] text-foreground flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="size-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <AlertTriangle className="size-8" />
        </div>
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {isConflict ? "Table Unavailable" : "Invalid Table Code"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  // Location display
  const getTableNames = () => {
    if (table.isMerged && table.mergeGroupId) {
      return table.name; // resolved endpoint returns combined names or formatted table
    }
    return table.name;
  };

  const addToCart = (item: { id: number; name: string; price: number }) => {
    setCart(prev => {
      const match = prev.find(i => i.menuItemId === item.id);
      if (match) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, qty: 1, price: item.price }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const payload: CreateOrderDto = {
      type: "DineIn",
      tableId: table.mergeGroupId ? null : table.id,
      mergeGroupId: table.mergeGroupId || null,
      isPriority: false,
      specialInstructions: specialInstructions.trim() || null,
      items: cart.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.qty,
        priceAtOrder: i.price,
        isAddOn: false
      }))
    };

    placeOrderMutation.mutate(payload);
  };

  const totalItemsCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.qty * i.price, 0);

  if (isOrdered) {
    return (
      <div className="min-h-screen bg-[#070e17] text-foreground flex flex-col items-center justify-center p-6 text-center gap-5 max-w-md mx-auto">
        <CheckCircle className="size-16 text-success animate-bounce" />
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold">Order Received!</h1>
          <p className="text-sm text-muted-foreground">Order <span className="font-bold text-foreground">{placedOrderNumber}</span> has been sent to the kitchen.</p>
        </div>
        <Card className="p-4 bg-sidebar/20 border-border/50 w-full">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase text-primary tracking-wider">
            {orderStatus === "New" && <Clock className="size-4 animate-spin text-orange-500" />}
            {orderStatus === "Preparing" && <ChefHat className="size-4 text-orange-500 animate-pulse" />}
            {(orderStatus === "Ready" || orderStatus === "Served") && <CheckCircle className="size-4 text-success" />}
            
            {orderStatus === "New" && "Order Received"}
            {orderStatus === "Preparing" && "Kitchen is preparing your food"}
            {orderStatus === "Ready" && "Your food is ready!"}
            {orderStatus === "Served" && "Your food has been served"}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {orderStatus === "New" && "Your order is in the queue."}
            {orderStatus === "Preparing" && "Please sit back and relax. Your meal will be served shortly."}
            {orderStatus === "Ready" && `A server will bring your food to Table ${getTableNames()} momentarily.`}
            {orderStatus === "Served" && "Enjoy your meal! You can order more items anytime."}
          </p>
        </Card>
        <Button className="rounded-xl w-full py-3 bg-primary text-primary-foreground font-bold" onClick={() => setIsOrdered(false)}>
          Order More Items
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070e17] text-foreground pb-24 flex flex-col max-w-md mx-auto border-x border-border/20">
      {/* Brand Header */}
      <header className="p-5 border-b border-border/30 sticky top-0 bg-[#070e17]/95 backdrop-blur-md z-40 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {settings?.logoUrl && (
              <div 
                className="size-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-lg"
                style={{ 
                  backgroundColor: settings?.logoBackgroundColor || 'var(--primary)',
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3), 0 0 10px -2px ${settings?.logoBackgroundColor || 'var(--primary)'}`
                }}
              >
                <img 
                  src={getImageUrl(settings.logoUrl)} 
                  alt="Logo" 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
            <h1 className="font-serif text-2xl font-bold text-foreground">{settings?.name || "Aurelia"}</h1>
          </div>
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-success fill-success/10" />
            Ordering from Table {getTableNames()}
          </p>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-success/30 bg-success/10 text-success">
          Live Order
        </span>
      </header>

      {/* Menu Area */}
      <main className="p-4 flex-1">
        {isMenuLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading Menu...</div>
        ) : (
          <Tabs value={activeMenuCat?.toString()} onValueChange={v => setActiveMenuCat(Number(v))}>
            <div className="overflow-x-auto scrollbar-none pb-2 border-b border-border/25">
              <TabsList className="flex gap-1.5 h-auto bg-transparent p-0">
                {menuGrouped.map(cat => (
                  <TabsTrigger 
                    key={cat.categoryId} 
                    value={cat.categoryId.toString()}
                    className="rounded-xl px-4 py-2 text-xs font-bold border border-border/40 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {cat.categoryName}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {menuGrouped.map(cat => (
              <TabsContent key={cat.categoryId} value={cat.categoryId.toString()} className="space-y-3 mt-4 animate-in fade-in duration-200">
                {cat.items.map(item => (
                  <Card key={item.id} className="p-3 rounded-2xl border-border/40 bg-sidebar/20 flex gap-3.5 items-center justify-between">
                    <div className="flex gap-3 items-center min-w-0 flex-1">
                      {item.image ? (
                        <div className="size-16 rounded-xl overflow-hidden relative flex-shrink-0">
                          <img 
                            src={getImageUrl(item.image)} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                          <span className={cn("absolute top-1 left-1 size-3 rounded-full border bg-background/90 flex items-center justify-center border-border", item.veg ? "border-success" : "border-destructive")}>
                            <span className={cn("block size-1.5 rounded-full", item.veg ? "bg-success" : "bg-destructive")} />
                          </span>
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-bold truncate text-foreground flex items-center gap-1.5">
                          {!item.image && (
                            <span className={cn("size-3 rounded-full border flex-shrink-0 flex items-center justify-center bg-transparent", item.veg ? "border-success" : "border-destructive")}>
                              <span className={cn("block size-1.5 rounded-full", item.veg ? "bg-success" : "bg-destructive")} />
                            </span>
                          )}
                          <span>{item.name}</span>
                        </h3>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                        <span className="text-xs font-extrabold text-foreground block mt-1.5">{displayCurrency}{item.price}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="size-8 p-0 rounded-xl border hover:bg-primary hover:text-white"
                      onClick={() => addToCart({ id: item.id!, name: item.name, price: item.price })}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-background/95 backdrop-blur-md border-t border-border/30 z-40">
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button className="w-full py-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex justify-between px-5 shadow-lg">
                <span className="flex items-center gap-2 text-sm">
                  <ShoppingBag className="size-4.5" />
                  View Cart ({totalItemsCount})
                </span>
                <span className="text-sm font-extrabold">{displayCurrency}{subtotal}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-3xl p-6 bg-background border-t border-border">
              <SheetHeader>
                <SheetTitle className="font-serif text-xl font-bold flex items-center justify-between text-foreground">
                  <span>Your Selection</span>
                  <span className="text-xs text-muted-foreground font-sans font-normal">{totalItemsCount} items</span>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-3.5 my-4 max-h-64 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm pb-2 border-b border-muted last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="font-semibold text-foreground truncate block">{item.name}</span>
                      <span className="text-xs text-muted-foreground font-semibold">{displayCurrency}{item.price} each</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="size-7 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold"
                        onClick={() => setCart(c => c.map((x, xi) => xi === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-foreground">{item.qty}</span>
                      <button 
                        className="size-7 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold"
                        onClick={() => setCart(c => c.map((x, xi) => xi === idx ? { ...x, qty: x.qty + 1 } : x))}
                      >
                        <Plus className="size-3" />
                      </button>
                      <button 
                        className="size-7 text-destructive ml-1"
                        onClick={() => setCart(c => c.filter((_, xi) => xi !== idx))}
                      >
                        <Minus className="size-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-3 border-t border-muted">
                <Input 
                  placeholder="Any special instructions for the chef?" 
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  className="rounded-xl font-medium"
                />

                <div className="flex justify-between text-base font-bold text-foreground">
                  <span>Subtotal</span>
                  <span>{displayCurrency}{subtotal}</span>
                </div>

                <Button 
                  className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 shadow-md"
                  onClick={handlePlaceOrder}
                  disabled={placeOrderMutation.isPending}
                >
                  {placeOrderMutation.isPending ? "Submitting order..." : "Confirm & Send to Kitchen"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
