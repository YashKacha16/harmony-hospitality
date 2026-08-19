import { apiClient, BASE_URL } from '../apiClient';

export interface GalleryItem {
  id?: number;
  imageUrl?: string | null;
  description?: string | null;
  createdAt?: string;
}

export const galleryService = {
  getGalleryItems: async (): Promise<GalleryItem[]> => {
    return apiClient.get<GalleryItem[]>('/api/Gallery');
  },

  createGalleryItem: async (description: string | null, file: File | null): Promise<GalleryItem> => {
    const formData = new FormData();
    if (description) formData.append('description', description);
    if (file) formData.append('file', file);
    const res = await fetch(`${BASE_URL}/api/Gallery`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to create gallery item');
    return res.json();
  },

  updateGalleryItem: async (id: number, data: { description: string | null }): Promise<void> => {
    return apiClient.put<void>(`/api/Gallery/${id}`, data);
  },

  deleteGalleryItem: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/api/Gallery/${id}`);
  }
};
