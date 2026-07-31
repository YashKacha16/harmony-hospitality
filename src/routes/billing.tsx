import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Send, Search, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingService } from "@/api/services/billingService";
import { settingsService } from "@/api/services/settingsService";
import { printViaIframe } from "@/lib/utils";

export const Route = createFileRoute("/billing")({
  head: () => ({ meta: [{ title: "Billing — Aurelia" }, { name: "description", content: "Room and restaurant invoices with tax breakdown, split bills and payment tracking." }] }),
  component: BillingPage,
});

function BillingPage() {
  const queryClient = useQueryClient();

  const { data: bills, isLoading } = useQuery({
    queryKey: ['restaurantBills'],
    queryFn: () => billingService.getBills()
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getGeneralSettings(),
    staleTime: 1000 * 60 * 5,
  });
  const currencySymbol = settings?.currency?.match(/\((.*?)\)/)?.[1] || settings?.currency || "$";

  const payBillMutation = useMutation({
    mutationFn: ({ id, method }: { id: number, method: string }) => billingService.payBill(id, method),
    onSuccess: () => {
      toast.success("Bill marked as paid");
      queryClient.invalidateQueries({ queryKey: ['restaurantBills'] });
    }
  });

  const updateBillMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { serviceChargePercent?: number; taxPercent?: number; cgstPercent?: number; sgstPercent?: number; discount?: number } }) =>
      billingService.updateBill(id, data),
    onSuccess: () => {
      toast.success("Bill updated successfully");
      queryClient.invalidateQueries({ queryKey: ['restaurantBills'] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update bill");
    }
  });

  return (
    <AppShell title="Billing" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Billing" }]}>
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center p-8 text-muted-foreground"><Loader2 className="animate-spin text-muted-foreground size-8 mx-auto" /></div>
        ) : bills?.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-2xl">No restaurant bills generated yet.</div>
            ) : bills?.map(bill => (
              <Card key={bill.id} className="p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-serif text-2xl">Invoice {bill.billNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {bill.order?.type === "DineIn" && `Table ${bill.order.tableName || "--"}`}
                      {bill.order?.type === "RoomService" && `Room ${bill.order.roomNumber || "--"}`}
                      {bill.order?.type === "Parcel" && (bill.order.parcelCode ? `Parcel (Code: ${bill.order.parcelCode})` : "Parcel")}
                    </div>
                  </div>
                  <StatusBadge status={bill.status} />
                </div>
                
                <div className="border-t border-border mt-4 pt-4">
                  <div className="font-medium mb-2">Order Items</div>
                  <ul className="text-sm space-y-1">
                    {bill.order?.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{item.quantity}× {item.name} {item.status === 'Cancelled' ? '(Cancelled)' : ''}</span>
                        <span className={item.status === 'Cancelled' ? 'line-through text-muted-foreground' : ''}>{currencySymbol}{(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-4 pt-3 border-t border-border w-72 ml-auto text-sm space-y-1">
                    <Row l="Subtotal" v={`${currencySymbol}${bill.subtotal.toFixed(2)}`} />
                    <Row l={`Service charge (${bill.serviceChargePercent ?? 10}%)`} v={`${currencySymbol}${bill.serviceCharge.toFixed(2)}`} />
                    {bill.cgstPercent != null && bill.sgstPercent != null ? (
                      <>
                        <Row l={`CGST (${bill.cgstPercent}%)`} v={`${currencySymbol}${((bill.taxAmount * bill.cgstPercent) / (bill.taxPercent || 18)).toFixed(2)}`} />
                        <Row l={`SGST (${bill.sgstPercent}%)`} v={`${currencySymbol}${((bill.taxAmount * bill.sgstPercent) / (bill.taxPercent || 18)).toFixed(2)}`} />
                      </>
                    ) : (
                      <Row l={`Tax (${bill.taxPercent ?? 18}%)`} v={`${currencySymbol}${bill.taxAmount.toFixed(2)}`} />
                    )}
                    {bill.discount > 0 && <Row l="Discount" v={`-${currencySymbol}${bill.discount.toFixed(2)}`} tone="text-success" />}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between font-serif text-lg">
                      <span>Total due</span>
                      <span className="text-primary">{currencySymbol}{bill.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {bill.status !== "Paid" ? (
                  <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground font-medium">Discount ($):</span>
                        <Input
                          type="number"
                          placeholder="0"
                          className="w-20 h-8 rounded-lg text-xs"
                          defaultValue={bill.discount || 0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseFloat((e.target as HTMLInputElement).value) || 0;
                              updateBillMutation.mutate({ id: bill.id, data: { discount: val } });
                            }
                          }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val !== bill.discount) {
                              updateBillMutation.mutate({ id: bill.id, data: { discount: val } });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-3">
                      <Button variant="outline" className="rounded-lg" onClick={() => printViaIframe(`/print/${bill.id}`)}>
                        <Printer className="size-4 mr-1" /> Print
                      </Button>
                      <Select defaultValue="Card" onValueChange={(val) => {
                        (window as any)[`payMethod_${bill.id}`] = val;
                      }}>
                        <SelectTrigger className="w-32 rounded-lg"><SelectValue placeholder="Card" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        className="rounded-lg bg-primary text-primary-foreground copper-glow" 
                        onClick={() => {
                          const method = (window as any)[`payMethod_${bill.id}`] || 'Card';
                          payBillMutation.mutate({ id: bill.id, method });
                        }}
                        disabled={payBillMutation.isPending}
                      >
                        {payBillMutation.isPending ? "Processing..." : "Mark as Paid"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 pt-4 border-t border-border flex justify-end">
                    <Button variant="outline" className="rounded-lg" onClick={() => printViaIframe(`/print/${bill.id}`)}>
                      <Printer className="size-4 mr-1" /> Print
                    </Button>
                  </div>
                )}
              </Card>
            ))}
      </div>
    </AppShell>
  );
}

function Row({ l, v, tone }: { l: string; v: string; tone?: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className={tone}>{v}</span></div>;
}
