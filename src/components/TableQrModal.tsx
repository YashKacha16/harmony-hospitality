import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Printer, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { tableService } from "@/api/services/tableService";
import { BASE_URL } from "@/api/apiClient";

interface TableQrModalProps {
  tableId: number;
  tableName: string;
  qrToken: string;
  open: boolean;
  onClose: () => void;
}

export function TableQrModal({ tableId, tableName, qrToken, open, onClose }: TableQrModalProps) {
  const queryClient = useQueryClient();
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [showConfirmRegen, setShowConfirmRegen] = useState(false);

  const regenerateMutation = useMutation({
    mutationFn: () => tableService.regenerateQr(tableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupedTables"] });
      setCacheBuster(Date.now());
      toast.success("QR code regenerated successfully.");
      setShowConfirmRegen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to regenerate QR code.");
    }
  });

  const handleDownload = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/tables/${tableId}/qr-image?t=${cacheBuster}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Table-${tableName}-QR.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download QR code.");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - Table ${tableName}</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              img { max-width: 100%; max-height: 100%; }
            </style>
          </head>
          <body>
            <img src="${BASE_URL}/api/tables/${tableId}/qr-image?t=${cacheBuster}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const qrImageUrl = `${BASE_URL}/api/tables/${tableId}/qr-image?t=${cacheBuster}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-center">
            Table {tableName} QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 mt-4">
          <div className="bg-white p-4 rounded-2xl border border-muted shadow-sm flex items-center justify-center">
            <img 
              src={qrImageUrl} 
              alt={`QR Code for Table ${tableName}`} 
              className="size-48 object-contain"
            />
          </div>

          <div className="w-full text-center text-xs text-muted-foreground break-all px-4">
            Token: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{qrToken}</code>
          </div>

          {showConfirmRegen ? (
            <div className="w-full bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-3">
              <p className="text-xs text-destructive font-medium text-center">
                Old QR code will stop working. Continue?
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-lg text-xs" 
                  onClick={() => setShowConfirmRegen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="rounded-lg text-xs" 
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                >
                  {regenerateMutation.isPending ? "Regenerating..." : "Confirm"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                className="rounded-xl flex flex-col items-center justify-center h-16 text-xs gap-1 border-muted hover:bg-muted"
                onClick={handleDownload}
              >
                <Download className="size-4" />
                Download
              </Button>
              <Button 
                variant="outline" 
                className="rounded-xl flex flex-col items-center justify-center h-16 text-xs gap-1 border-muted hover:bg-muted"
                onClick={handlePrint}
              >
                <Printer className="size-4" />
                Print
              </Button>
              <Button 
                variant="outline" 
                className="rounded-xl flex flex-col items-center justify-center h-16 text-xs gap-1 border-muted text-destructive hover:bg-destructive/5 hover:border-destructive/20"
                onClick={() => setShowConfirmRegen(true)}
              >
                <RefreshCw className="size-4" />
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
