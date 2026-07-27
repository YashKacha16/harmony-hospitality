import { apiClient } from '../apiClient';
import { MenuItem } from '../../types/models';

export interface MenuGrouped {
    categoryId: number;
    categoryName: string;
    position: number;
    items: MenuItem[];
}

export const menuService = {
    getAll: (categoryId?: number) => apiClient.get<MenuItem[]>(`/api/Menu${categoryId ? `?categoryId=${categoryId}` : ''}`),
    getGrouped: () => apiClient.get<MenuGrouped[]>('/api/Menu/grouped'),
    getById: (id: number) => apiClient.get<MenuItem>(`/api/Menu/${id}`),
    create: (menuItem: Partial<MenuItem>) => apiClient.post<MenuItem>('/api/Menu', menuItem),
    update: (id: number, menuItem: Partial<MenuItem>) => apiClient.put<void>(`/api/Menu/${id}`, menuItem),
    delete: (id: number) => apiClient.delete<void>(`/api/Menu/${id}`),
    toggleAvailability: (id: number) => apiClient.request<void>(`/api/Menu/${id}/availability`, { method: 'PATCH' }),
    reorder: (positions: { id: number; position: number }[]) => 
        apiClient.request<void>('/api/Menu/reorder', {
            method: 'PATCH',
            body: JSON.stringify(positions),
        }),
    uploadImage: (id: number, file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return apiClient.request<{ message: string }>(`/api/Menu/${id}/image`, {
            method: 'POST',
            body: formData as any,
            headers: {
                'Content-Type': undefined,
            } as any,
        });
    }
};
