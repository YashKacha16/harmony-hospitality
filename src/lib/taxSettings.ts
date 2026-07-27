export interface TaxSettings {
  currency: string;
  serviceChargePercent: number;
  cgstPercent: number;
  sgstPercent: number;
  taxPercent: number; // cgst + sgst
}

export function getTaxSettings(): TaxSettings {
  try {
    const saved = localStorage.getItem("tax_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      const cgst = Number(parsed.cgstPercent ?? 9);
      const sgst = Number(parsed.sgstPercent ?? 9);
      return {
        currency: parsed.currency || "USD ($)",
        serviceChargePercent: Number(parsed.serviceChargePercent ?? 10),
        cgstPercent: cgst,
        sgstPercent: sgst,
        taxPercent: cgst + sgst,
      };
    }
  } catch {
    // fallback
  }
  return {
    currency: "USD ($)",
    serviceChargePercent: 10,
    cgstPercent: 9,
    sgstPercent: 9,
    taxPercent: 18,
  };
}

export function saveTaxSettings(settings: Omit<TaxSettings, "taxPercent">) {
  localStorage.setItem("tax_settings", JSON.stringify(settings));
}
