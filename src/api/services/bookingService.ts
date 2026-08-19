import { apiClient } from '../apiClient';
import type { RoomDto } from './roomService';

export interface BookingDto {
  id: number;
  bookingCode: string;
  guestName: string;
  phone: string;
  email: string;
  idNumber: string;
  idProofUrl: string;
  roomId: number;
  room?: RoomDto;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  source: string;
  guests: number;
  advanceAmount: number;
  paymentMethod: string;
  status: string;
  forfeitedAmount?: number;
  refundAmount?: number;
  refundMethod?: string;
  refundStatus?: string;
  totalPaidAmount?: number;
}

export const bookingService = {
  getAll: async (status?: string, propertyId?: number) => {
    let url = '/api/Bookings';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (propertyId) params.append('propertyId', propertyId.toString());
    const qString = params.toString();
    if (qString) url += `?${qString}`;
    return apiClient.get<BookingDto[]>(url);
  },

  getById: async (id: number) => {
    return apiClient.get<BookingDto>(`/api/Bookings/${id}`);
  },

  create: async (data: FormData) => {
    return apiClient.post<BookingDto>('/api/Bookings', data);
  },

  markNoShow: async (id: number) => {
    return apiClient.request(`/api/Bookings/${id}/mark-no-show`, { method: 'PATCH' });
  },

  update: async (id: number, data: Partial<BookingDto>) => {
    return apiClient.put(`/api/Bookings/${id}`, data);
  },

  getRoomBill: async (id: number) => {
    return apiClient.get<any>(`/api/Bookings/${id}/bill`);
  },

  checkout: async (id: number, paymentMethod: string) => {
    return apiClient.post(`/api/Bookings/${id}/checkout`, { paymentMethod });
  }
};
