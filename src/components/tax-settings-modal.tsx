import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getTaxSettings, saveTaxSettings } from "@/lib/taxSettings";
import { Settings } from "lucide-react";

export function TaxSettingsModal() {
  const [open, setOpen] = useState(false);
  const [taxConfig, setTaxConfig] = useState(() => getTaxSettings());

  useEffect(() => {
    if (open) {
      setTaxConfig(getTaxSettings());
    }
  }, [open]);

  const handleSaveTax = () => {
    saveTaxSettings({
      currency: taxConfig.currency,
      serviceChargePercent: Number(taxConfig.serviceChargePercent) || 0,
      cgstPercent: Number(taxConfig.cgstPercent) || 0,
      sgstPercent: Number(taxConfig.sgstPercent) || 0,
    });
    toast.success("Tax & currency settings saved successfully");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-lg gap-2 bg-background hover:bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground shadow-sm">
          <Settings className="size-3.5" />
          <span className="text-xs font-medium">Tax Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[1.5rem] p-6 border-border/50 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-serif text-2xl tracking-tight text-foreground">Tax & Currency</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground ml-1">Currency</Label>
              <Select 
                value={taxConfig.currency || "INR (₹)"} 
                onValueChange={(val) => setTaxConfig(prev => ({ ...prev, currency: val }))}
              >
                <SelectTrigger className="rounded-xl bg-muted/30 border-border/50 h-10 transition-colors focus:bg-background text-left">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR (₹)">INR (₹)</SelectItem>
                  <SelectItem value="USD ($)">USD ($)</SelectItem>
                  <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                  <SelectItem value="GBP (£)">GBP (£)</SelectItem>
                  <SelectItem value="AED (د.إ)">AED (د.إ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground ml-1">Service charge %</Label>
              <Input 
                type="number"
                value={taxConfig.serviceChargePercent} 
                onChange={(e) => setTaxConfig(prev => ({ ...prev, serviceChargePercent: parseFloat(e.target.value) || 0 }))}
                className="rounded-xl bg-muted/30 border-border/50 h-10 transition-colors focus:bg-background" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground ml-1">CGST %</Label>
              <Input 
                type="number"
                value={taxConfig.cgstPercent} 
                onChange={(e) => setTaxConfig(prev => ({ ...prev, cgstPercent: parseFloat(e.target.value) || 0 }))}
                className="rounded-xl bg-muted/30 border-border/50 h-10 transition-colors focus:bg-background" 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground ml-1">SGST %</Label>
              <Input 
                type="number"
                value={taxConfig.sgstPercent} 
                onChange={(e) => setTaxConfig(prev => ({ ...prev, sgstPercent: parseFloat(e.target.value) || 0 }))}
                className="rounded-xl bg-muted/30 border-border/50 h-10 transition-colors focus:bg-background" 
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button 
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-10 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5" 
            onClick={handleSaveTax}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
