import { apiClient } from '../apiClient';

export interface Category {
    id: number;
    name: string;
    position: number;
    isActive: boolean;
}

export const categoryService = {
    getAll: () => apiClient.get<Category[]>('/api/category'),
    getById: (id: number) => apiClient.get<Category>(`/api/category/${id}`),
    create: (category: Partial<Category>) => apiClient.post<Category>('/api/category', category),
    update: (id: number, category: Partial<Category>) => apiClient.put<void>(`/api/category/${id}`, category),
    delete: (id: number) => apiClient.delete<void>(`/api/category/${id}`),
    reorder: (positions: { id: number; position: number }[]) => 
        apiClient.request<void>('/api/category/reorder', {
            method: 'PATCH',
            body: JSON.stringify(positions),
        }),
};
