import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/api/services/bookingService";
import { settingsService } from "@/api/services/settingsService";
import React, { useEffect } from "react";
import { getImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/print-booking/$bookingId")({
  component: PrintBookingBillPage,
});

function PrintBookingBillPage() {
  const { bookingId } = Route.useParams();
  const id = Number(bookingId);

  const { data: bill, isLoading: isLoadingBill } = useQuery({
    queryKey: ['booking-bill', id],
    queryFn: () => bookingService.getRoomBill(id),
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getGeneralSettings(),
  });

  const currencySymbol = settings?.currency?.match(/\((.*?)\)/)?.[1] || settings?.currency || "$";

  useEffect(() => {
    if (!isLoadingBill && !isLoadingSettings && bill && settings) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isLoadingBill, isLoadingSettings, bill, settings]);

  if (isLoadingBill || isLoadingSettings) {
    return <div className="p-8 text-center text-black bg-white min-h-screen">Loading bill...</div>;
  }

  if (!bill) {
    return <div className="p-8 text-center text-red-500 bg-white min-h-screen">Bill not found</div>;
  }

  return (
    <div className="bg-white text-black min-h-screen p-8 font-sans">
      <div className="max-w-3xl mx-auto border border-gray-200 p-10 shadow-sm print:shadow-none print:border-none print:p-0">
        
        {/* Header: Logo and Hotel Details */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider">{settings?.name || "Hotel"}</h1>
            {settings?.address && <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap leading-tight max-w-xs">{settings.address}</p>}
            <p className="text-sm text-gray-600 mt-1">
              {settings?.phone && `Tel: ${settings.phone}`}
              {settings?.phone && settings?.email && " | "}
              {settings?.email && `${settings.email}`}
            </p>
          </div>
          {settings?.logoUrl && (
            <div className="mb-2 h-16 grayscale">
              <img 
                src={getImageUrl(settings.logoUrl)} 
                alt="Logo" 
                className="h-full w-full object-contain" 
              />
            </div>
          )}
        </div>

        {/* Invoice Title & Guest Details */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-semibold text-gray-800 uppercase tracking-widest">Invoice</h2>
        </div>

        <div className="flex justify-between mb-8 text-sm">
          <div className="space-y-1">
            <p><strong className="text-gray-700 w-24 inline-block">Guest Name:</strong> {bill.guestName}</p>
            <p><strong className="text-gray-700 w-24 inline-block">Room No:</strong> {bill.roomNumber}</p>
          </div>
          <div className="space-y-1 text-right">
            <p><strong className="text-gray-700 mr-2">Check-in:</strong> {new Date(bill.checkInDateTime).toLocaleDateString()}</p>
            <p><strong className="text-gray-700 mr-2">Check-out:</strong> {new Date(bill.checkOutDateTime).toLocaleDateString()}</p>
            <p><strong className="text-gray-700 mr-2">Nights:</strong> {bill.billedNights}</p>
          </div>
        </div>

        {/* Bill Breakdown Table */}
        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="bg-gray-100 border-y border-gray-300 text-left">
              <th className="py-3 px-4 font-semibold text-gray-700">Description</th>
              <th className="py-3 px-4 font-semibold text-gray-700 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4 text-gray-800">
                Room Charges <span className="text-gray-500 text-xs ml-1">({bill.billedNights} nights × {currencySymbol}{bill.roomPricePerNight})</span>
              </td>
              <td className="py-4 px-4 text-right text-gray-800 font-medium">
                {currencySymbol}{bill.totalRoomAmount.toFixed(2)}
              </td>
            </tr>
            {bill.restaurantOrders && bill.restaurantOrders.length > 0 && (
              <>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td colSpan={2} className="py-2 px-4 font-medium text-gray-700">Restaurant & Room Service</td>
                </tr>
                {bill.restaurantOrders.map((o: any) => (
                  <React.Fragment key={o.id}>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 px-8 text-gray-800 font-medium">
                        Order #{o.orderNumber}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-800 font-medium">
                        {currencySymbol}{o.subtotal.toFixed(2)}
                      </td>
                    </tr>
                    {o.items && o.items.length > 0 && o.items.map((item: any, idx: number) => (
                      <tr key={`${o.id}-item-${idx}`} className="border-b border-gray-50/50">
                        <td className="py-1 px-12 text-gray-500 text-sm">
                          {item.name} <span className="text-xs ml-1">x {item.quantity}</span>
                        </td>
                        <td className="py-1 px-4 text-right text-gray-500 text-sm">
                          {currencySymbol}{(item.priceAtOrder * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700 text-right font-medium">Restaurant Total:</td>
                  <td className="py-3 px-4 text-right text-gray-800 font-medium">
                    {currencySymbol}{bill.totalRestaurantAmount.toFixed(2)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end">
          <div className="w-80 space-y-3 text-sm">
            {bill.taxesAmount !== undefined && (
              <div className="flex justify-between text-gray-700 px-4">
                <span>Taxes ({bill.cgstPercent + bill.sgstPercent}%)</span>
                <span className="font-medium">{currencySymbol}{bill.taxesAmount.toFixed(2)}</span>
              </div>
            )}
            {bill.serviceChargeAmount !== undefined && (
              <div className="flex justify-between text-gray-700 px-4">
                <span>Service Charge ({bill.serviceChargePercent}%)</span>
                <span className="font-medium">{currencySymbol}{bill.serviceChargeAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700 px-4 pt-2 border-t border-gray-200">
              <span>Total Amount</span>
              <span className="font-medium">{currencySymbol}{bill.totalAmount.toFixed(2)}</span>
            </div>
            {bill.advanceAmount > 0 && (
              <div className="flex justify-between text-emerald-600 px-4">
                <span>Advance Paid</span>
                <span className="font-medium">-{currencySymbol}{bill.advanceAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 px-4 py-3 bg-gray-100 rounded border border-gray-200">
              <span>Amount Due</span>
              <span>{currencySymbol}{bill.dueAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-300 text-center text-sm text-gray-600">
          <p className="font-medium">Thank you for staying with us!</p>
          <p className="mt-1">We hope to welcome you back soon.</p>
        </div>
        
        <div className="mt-8 flex justify-center gap-4 print:hidden">
          <button onClick={() => window.close()} className="px-6 py-2 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300">Close</button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90">Print Again</button>
        </div>

      </div>
    </div>
  );
}
