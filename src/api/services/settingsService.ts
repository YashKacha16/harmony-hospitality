import { apiClient } from '../apiClient';
import { TaxSettings } from '@/lib/taxSettings';

export interface GeneralSettings {
  id?: number;
  name: string;
  logoUrl?: string | null;
  address: string;
  phone: string;
  email: string;
  currency: string;
  serviceChargePercent: number;
  cgstPercent: number;
  sgstPercent: number;
  waitlistEstimatedWaitMinutes?: number;
  waitlistMessage?: string;
  minimumAdvancePercent?: number;
}

export const settingsService = {
  getGeneralSettings: async (): Promise<GeneralSettings> => {
    // Wait for the backend API to be ready, but for now we define the interface
    // Note: If you want to use Admin auth via header, you can pass headers in apiClient if needed
    // However, since we removed the [AdminOnly] attribute, this works out of the box
    const res = await apiClient.get<GeneralSettings>('/api/Settings/general');
    return res;
  },

  updateGeneralSettings: async (data: GeneralSettings): Promise<GeneralSettings> => {
    const res = await apiClient.put<GeneralSettings>('/api/Settings/general', data);
    return res;
  },

  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    // Use standard fetch since apiClient overrides body to JSON unless it's FormData, but apiClient.post doesn't support FormData directly because it does JSON.stringify(body).
    // Wait, let's just use fetch directly.
    const res = await fetch('http://localhost:5157/api/Settings/logo', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }
};
