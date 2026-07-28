import { apiClient } from '../apiClient';

export interface WaitlistDto {
    id: number;
    token: string;
    guestName: string;
    phone: string;
    partySize: number;
    seatingPreference: string;
    notes: string;
    status: string;
    createdAt: string;
    waitedMin: number;
    assignedTableId?: number;
    assignedTableName?: string;
}

export interface CreateWaitlistDto {
    guestName: string;
    phone: string;
    partySize: number;
    seatingPreference: string;
    notes: string;
}

export const waitlistService = {
    getAll: () => apiClient.get<WaitlistDto[]>('/api/waitlist'),
    
    create: (dto: CreateWaitlistDto) => apiClient.post<WaitlistDto>('/api/waitlist', dto),
    
    updateStatus: (id: number, status: number) => apiClient.put<WaitlistDto>(`/api/waitlist/${id}/status`, status),
    
    assignTable: (id: number, tableId: number) => apiClient.post<WaitlistDto>(`/api/waitlist/${id}/assign`, tableId)
};
