import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "@/api/services/bookingService";
import { settingsService } from "@/api/services/settingsService";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

const REFUND_STATUSES = [
  { value: "Pending", label: "Pending", color: "bg-yellow-500/15 text-yellow-500" },
  { value: "Refunded", label: "Refunded", color: "bg-emerald-500/15 text-emerald-500" },
  { value: "No Refund", label: "No Refund", color: "bg-muted text-muted-foreground" },
  { value: "Processing", label: "Processing", color: "bg-blue-500/15 text-blue-500" },
  { value: "Failed", label: "Failed", color: "bg-destructive/15 text-destructive" },
];

function getStatusStyle(status: string) {
  return REFUND_STATUSES.find((s) => s.value === status)?.color ?? "bg-muted text-muted-foreground";
}

function RefundStatusCell({ bookingId, currentStatus }: { bookingId: number; currentStatus: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (newStatus: string) =>
      bookingService.update(bookingId, { refundStatus: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "Cancelled"] });
      toast.success("Refund status updated");
    },
    onError: () => toast.error("Failed to update refund status"),
  });

  return (
    <Select
      value={currentStatus}
      onValueChange={(val) => mutation.mutate(val)}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger
        className={`h-7 w-36 border-0 rounded-full px-2.5 text-xs font-medium focus:ring-0 ${getStatusStyle(currentStatus)}`}
      >
        {mutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent>
        {REFUND_STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            <span className={`inline-flex items-center gap-1.5`}>
              {s.value === currentStatus && <Check className="h-3 w-3" />}
              {s.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CancellationsTab() {
  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings", "Cancelled"],
    queryFn: () => bookingService.getAll("Cancelled"),
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.getGeneralSettings(),
  });

  const currencySymbol = settings?.currency
    ? settings.currency.match(/\(([^)]+)\)/)?.[1] || settings.currency
    : "₹";

  return (
    <Card className="rounded-2xl overflow-hidden mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
              <th className="px-4 py-3">Booking ID</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Advance</th>
              <th className="px-4 py-3">Refund Status</th>
              <th className="px-4 py-3 text-right">Refund Amount</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No cancelled bookings found.
                </td>
              </tr>
            )}
            {bookings.map((b) => {
              const hasRefund = (b.refundAmount ?? 0) > 0;
              const statusText = b.refundStatus || (hasRefund ? "Refunded" : "No Refund");
              return (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium">#{b.bookingCode || b.id}</td>
                  <td className="px-4 py-3">{b.guestName}</td>
                  <td className="px-4 py-3">{b.room ? `Room ${b.room.number}` : "-"}</td>
                  <td className="px-4 py-3">{new Date(b.checkInDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {currencySymbol}{b.advanceAmount}
                  </td>
                  <td className="px-4 py-3">
                    <RefundStatusCell bookingId={b.id} currentStatus={statusText} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-500">
                    {b.refundAmount != null
                      ? `${currencySymbol}${b.refundAmount.toLocaleString()}`
                      : `${currencySymbol}0`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
