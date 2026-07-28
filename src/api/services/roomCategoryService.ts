import { apiClient } from '../apiClient';

export interface RoomCategoryDto {
  id: number;
  name: string;
  basePrice: number;
  currency: string;
  seasonalPricingEnabled: boolean;
  isActive: boolean;
  capacity?: number;
  amenities?: string;
  imageUrl?: string;
  seasonalRuleCount: number;
}

export interface CreateRoomCategoryDto {
  name: string;
  basePrice: number;
  currency?: string;
  seasonalPricingEnabled?: boolean;
  isActive?: boolean;
  capacity?: number;
  amenities?: string;
}

export interface UpdateRoomCategoryDto {
  name: string;
  basePrice: number;
  currency: string;
  seasonalPricingEnabled: boolean;
  isActive: boolean;
  capacity?: number;
  amenities?: string;
}

export interface SeasonalRuleDto {
  id: number;
  roomCategoryId: number;
  name: string;
  startDate?: string;
  endDate?: string;
  isRecurring: boolean;
  daysOfWeek?: string;
  priceModifierPercent: number;
  isActive: boolean;
}

export interface CreateSeasonalRuleDto {
  name: string;
  startDate?: string;
  endDate?: string;
  isRecurring?: boolean;
  daysOfWeek?: string;
  priceModifierPercent: number;
  isActive?: boolean;
}

export interface UpdateSeasonalRuleDto {
  name: string;
  startDate?: string;
  endDate?: string;
  isRecurring: boolean;
  daysOfWeek?: string;
  priceModifierPercent: number;
  isActive: boolean;
}

export const roomCategoryService = {
  getAll: () => apiClient.get<RoomCategoryDto[]>('/api/RoomCategories'),

  getById: (id: number) => apiClient.get<RoomCategoryDto>(`/api/RoomCategories/${id}`),

  create: (dto: CreateRoomCategoryDto) => apiClient.post<RoomCategoryDto>('/api/RoomCategories', dto),

  update: (id: number, dto: UpdateRoomCategoryDto) => apiClient.put<RoomCategoryDto>(`/api/RoomCategories/${id}`, dto),

  delete: (id: number) => apiClient.delete(`/api/RoomCategories/${id}`),

  // Seasonal Rules
  getSeasonalRules: (categoryId: number) =>
    apiClient.get<SeasonalRuleDto[]>(`/api/RoomCategories/${categoryId}/seasonal-rules`),

  createSeasonalRule: (categoryId: number, dto: CreateSeasonalRuleDto) =>
    apiClient.post<SeasonalRuleDto>(`/api/RoomCategories/${categoryId}/seasonal-rules`, dto),

  updateSeasonalRule: (categoryId: number, ruleId: number, dto: UpdateSeasonalRuleDto) =>
    apiClient.put<SeasonalRuleDto>(`/api/RoomCategories/${categoryId}/seasonal-rules/${ruleId}`, dto),

  deleteSeasonalRule: (categoryId: number, ruleId: number) =>
    apiClient.delete(`/api/RoomCategories/${categoryId}/seasonal-rules/${ruleId}`),
};
