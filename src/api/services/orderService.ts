import { apiClient } from '../apiClient';
import { CreateOrderDto, OrderDto, KanbanOrdersDto, UpdateOrderItemDto } from '../../types/models';

export const orderService = {
    getKanban: (type: string) => 
        apiClient.get<KanbanOrdersDto>(`/api/orders/kanban?type=${type}`),

    create: (order: CreateOrderDto) => 
        apiClient.post<OrderDto>('/api/orders', order),

    updateStatus: (id: number, status: string) => 
        apiClient.request<OrderDto>(`/api/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        }),

    acknowledgeAddOns: (id: number) => 
        apiClient.post<OrderDto>(`/api/orders/${id}/acknowledge-addons`, {}),

    updateItems: (id: number, items: UpdateOrderItemDto[]) => 
        apiClient.put<OrderDto>(`/api/orders/${id}/items`, items),

    cancel: (id: number) => 
        apiClient.post<OrderDto>(`/api/orders/${id}/cancel`, {})
};
