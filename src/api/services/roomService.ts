import { apiClient } from '../apiClient';
import type { RoomCategoryDto } from './roomCategoryService';

export interface RoomDto {
  id: number;
  number: string;
  categoryId: number;
  category?: RoomCategoryDto;
  floor?: string;
  capacity: number;
  basePrice: number;
  status: string;
  amenities: string[];
  images: string[];
  description?: string;
}

export interface CreateRoomDto {
  number: string;
  categoryId: number;
  floor?: string;
  capacity: number;
  basePrice: number;
  status: string;
  amenities: string[];
  images: string[];
  description?: string;
}

export interface UpdateRoomDto {
  number: string;
  categoryId: number;
  floor?: string;
  capacity: number;
  basePrice: number;
  status: string;
  amenities: string[];
  images: string[];
  description?: string;
}

export const roomService = {
  getAll: async (params?: { categoryId?: number; status?: string; floor?: string }) => {
    let url = '/api/Rooms';
    if (params) {
      const q = new URLSearchParams();
      if (params.categoryId) q.append('categoryId', params.categoryId.toString());
      if (params.status) q.append('status', params.status);
      if (params.floor) q.append('floor', params.floor);
      const qString = q.toString();
      if (qString) url += `?${qString}`;
    }
    return apiClient.get<RoomDto[]>(url);
  },

  getById: async (id: number) => {
    return apiClient.get<RoomDto>(`/api/Rooms/${id}`);
  },

  create: async (data: CreateRoomDto) => {
    return apiClient.post<RoomDto>('/api/Rooms', data);
  },

  update: async (id: number, data: UpdateRoomDto) => {
    return apiClient.put<void>(`/api/Rooms/${id}`, data);
  },

  delete: async (id: number) => {
    return apiClient.delete<void>(`/api/Rooms/${id}`);
  }
};
