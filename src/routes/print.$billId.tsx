import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { billingService } from "@/api/services/billingService";
import { settingsService } from "@/api/services/settingsService";
import { useEffect } from "react";
import { getImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/print/$billId")({
  component: PrintBillPage,
});

function PrintBillPage() {
  const { billId } = Route.useParams();
  const id = Number(billId);

  const { data: bills, isLoading: isLoadingBill } = useQuery({
    queryKey: ['restaurantBills'],
    queryFn: () => billingService.getBills()
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getGeneralSettings(),
  });

  const bill = bills?.find(b => b.id === id);
  const currencySymbol = settings?.currency?.match(/\((.*?)\)/)?.[1] || settings?.currency || "$";

  useEffect(() => {
    if (!isLoadingBill && !isLoadingSettings && bill && settings) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isLoadingBill, isLoadingSettings, bill, settings]);

  if (isLoadingBill || isLoadingSettings) {
    return <div className="p-8 text-center text-black bg-white min-h-screen">Loading receipt...</div>;
  }

  if (!bill) {
    return <div className="p-8 text-center text-red-500 bg-white min-h-screen">Bill not found</div>;
  }

  return (
    <div className="bg-white text-black min-h-screen p-8 font-sans">
      <div className="max-w-md mx-auto border border-gray-200 p-6 shadow-sm print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-6">
          {settings?.logoUrl && (
            <div className="mb-2 h-16 grayscale">
              <img 
                src={getImageUrl(settings.logoUrl)} 
                alt="Logo" 
                className="h-full w-full object-contain" 
              />
            </div>
          )}
          <h1 className="text-2xl font-bold uppercase tracking-wider">{settings?.name || "Restaurant"}</h1>
          {settings?.address && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-tight">{settings.address}</p>}
          <p className="text-sm text-gray-600 mt-1">
            {settings?.phone && `Tel: ${settings.phone}`}
            {settings?.phone && settings?.email && " | "}
            {settings?.email && `${settings.email}`}
          </p>
        </div>

        <div className="border-t border-b border-black py-3 mb-4 text-sm flex justify-between">
          <div>
            <div><strong>Invoice:</strong> {bill.billNumber}</div>
            <div><strong>Date:</strong> {new Date(bill.createdAt || Date.now()).toLocaleString()}</div>
          </div>
          <div className="text-right">
             <div className="font-semibold">
              {bill.order?.type === "DineIn" && `Table ${bill.order.tableName || "--"}`}
              {bill.order?.type === "RoomService" && `Room ${bill.order.roomNumber || "--"}`}
              {bill.order?.type === "Parcel" && (bill.order.parcelCode ? `Parcel (Code: ${bill.order.parcelCode})` : "Parcel")}
             </div>
             <div className="text-gray-600 text-xs mt-1">{bill.status === "Paid" ? "PAID" : "PENDING"}</div>
          </div>
        </div>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-2 w-3/5">Item</th>
              <th className="py-2 text-center w-1/5">Qty</th>
              <th className="py-2 text-right w-1/5">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.order?.items.map((item, idx) => (
              <tr key={idx} className={`border-b border-gray-100 ${item.status === 'Cancelled' ? 'text-gray-400 line-through' : ''}`}>
                <td className="py-2 pr-2">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{currencySymbol}{item.priceAtOrder.toFixed(2)} each</div>
                </td>
                <td className="py-2 text-center font-bold">{item.quantity}</td>
                <td className="py-2 text-right">{currencySymbol}{(item.priceAtOrder * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end text-sm mt-4">
          <div className="w-48 space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>{currencySymbol}{bill.subtotal.toFixed(2)}</span>
            </div>
            {bill.serviceChargePercent ? (
              <div className="flex justify-between text-gray-600">
                <span>Service ({bill.serviceChargePercent}%):</span>
                <span>{currencySymbol}{bill.serviceCharge.toFixed(2)}</span>
              </div>
            ) : null}
            {bill.cgstPercent != null && bill.sgstPercent != null ? (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>CGST ({bill.cgstPercent}%):</span>
                  <span>{currencySymbol}{((bill.taxAmount * bill.cgstPercent) / (bill.taxPercent || 18)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>SGST ({bill.sgstPercent}%):</span>
                  <span>{currencySymbol}{((bill.taxAmount * bill.sgstPercent) / (bill.taxPercent || 18)).toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-gray-600">
                <span>Tax ({bill.taxPercent}%):</span>
                <span>{currencySymbol}{bill.taxAmount.toFixed(2)}</span>
              </div>
            )}
            {bill.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-{currencySymbol}{bill.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-black mt-2">
              <span>Total:</span>
              <span>{currencySymbol}{bill.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-dashed border-gray-400 text-center text-sm text-gray-600 font-medium">
          <p>Thank you for your visit!</p>
          <p className="mt-1">Have a wonderful day.</p>
        </div>
        
        <div className="mt-8 flex justify-center gap-4 print:hidden">
          <button onClick={() => window.close()} className="px-6 py-2 bg-gray-200 rounded-lg font-bold">Close Window</button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Print Invoice</button>
        </div>
      </div>
    </div>
  );
}
