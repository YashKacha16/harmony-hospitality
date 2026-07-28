import { apiClient } from "../apiClient";
import { OrderDto } from "@/types/models"; // Or we can define RestaurantBillDto here

export interface BillSplitDto {
  id: number;
  splitName: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  paidAt?: string;
}

export interface RestaurantBillDto {
  id: number;
  billNumber: string;
  orderId: number;
  subtotal: number;
  taxAmount: number;
  taxPercent?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  serviceCharge: number;
  serviceChargePercent?: number;
  discount: number;
  totalAmount: number;
  paymentMethod?: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  splits: BillSplitDto[];
  order?: OrderDto;
}

export const billingService = {
  getBills: async (): Promise<RestaurantBillDto[]> => {
    const response = await apiClient.get<RestaurantBillDto[]>("/api/billing");
    return response;
  },
  
  getBill: async (id: number): Promise<RestaurantBillDto> => {
    const response = await apiClient.get<RestaurantBillDto>(`/api/billing/${id}`);
    return response;
  },
  
  generateBill: async (data: { orderId: number; serviceChargePercent?: number; taxPercent?: number; cgstPercent?: number; sgstPercent?: number; discount?: number } | number): Promise<RestaurantBillDto> => {
    const payload = typeof data === "number" ? { orderId: data } : data;
    const response = await apiClient.post<RestaurantBillDto>("/api/billing/generate", payload);
    return response;
  },

  updateBill: async (id: number, data: { serviceChargePercent?: number; taxPercent?: number; cgstPercent?: number; sgstPercent?: number; discount?: number }): Promise<RestaurantBillDto> => {
    const response = await apiClient.put<RestaurantBillDto>(`/api/billing/${id}`, data);
    return response;
  },

  payBill: async (id: number, paymentMethod: string): Promise<RestaurantBillDto> => {
    const response = await apiClient.post<RestaurantBillDto>(`/api/billing/${id}/pay`, { paymentMethod });
    return response;
  }
};
