import { apiClient } from '../apiClient';

export interface Chef {
  id?: number;
  name: string;
  role?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
}

export const chefService = {
  getChefs: async (): Promise<Chef[]> => {
    return apiClient.get<Chef[]>('/api/Chefs');
  },

  getChef: async (id: number): Promise<Chef> => {
    return apiClient.get<Chef>(`/api/Chefs/${id}`);
  },

  createChef: async (data: Chef): Promise<Chef> => {
    return apiClient.post<Chef>('/api/Chefs', data);
  },

  updateChef: async (id: number, data: Chef): Promise<Chef> => {
    return apiClient.put<Chef>(`/api/Chefs/${id}`, data);
  },

  deleteChef: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/Chefs/${id}`);
  },

  uploadImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('https://hotel-backend.runasp.net/api/Chefs/upload-image', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }
};
