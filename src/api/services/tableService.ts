import { apiClient } from '../apiClient';
import { RestaurantTableDto, TableGroupedDto, TableCategory } from '../../types/models';

export const tableService = {
    getAll: () => apiClient.get<RestaurantTableDto[]>('/api/tables'),
    getGrouped: () => apiClient.get<TableGroupedDto[]>('/api/tables/grouped'),
    getById: (id: number) => apiClient.get<RestaurantTableDto>(`/api/tables/${id}`),
    create: (table: Partial<RestaurantTableDto>) => apiClient.post<RestaurantTableDto>('/api/tables', table),
    update: (id: number, table: Partial<RestaurantTableDto>) => apiClient.put<void>(`/api/tables/${id}`, table),
    delete: (id: number) => apiClient.delete<void>(`/api/tables/${id}`),
    
    merge: (tableIds: number[]) => apiClient.post<RestaurantTableDto[]>('/api/tables/merge', { tableIds }),
    unmerge: (mergeGroupId: number) => apiClient.post<{ message: string }>(`/api/tables/${mergeGroupId}/unmerge`, {}),
    
    bulkStatus: (tableIds: number[], status: string) => 
        apiClient.request<void>('/api/tables/bulk-status', {
            method: 'PATCH',
            body: JSON.stringify({ tableIds, status })
        }),
        
    bulkCategory: (tableIds: number[], categoryId: number) => 
        apiClient.request<void>('/api/tables/bulk-category', {
            method: 'PATCH',
            body: JSON.stringify({ tableIds, categoryId })
        }),
        
    bulkDelete: (tableIds: number[]) => 
        apiClient.request<{ skippedIds: number[] }>('/api/tables/bulk', {
            method: 'DELETE',
            body: JSON.stringify({ tableIds })
        }),

    regenerateQr: (id: number) => apiClient.post<RestaurantTableDto>(`/api/tables/${id}/regenerate-qr`, {}),
    
    getTableCategories: () => apiClient.get<TableCategory[]>('/api/table-category'),

    createTableCategory: (category: Partial<TableCategory>) => apiClient.post<TableCategory>('/api/table-category', category),

    deleteTableCategory: (id: number) => apiClient.delete<void>(`/api/table-category/${id}`),

    resolveByQrToken: (qrToken: string) => apiClient.get<RestaurantTableDto>(`/api/tables/resolve/${qrToken}`)
};
