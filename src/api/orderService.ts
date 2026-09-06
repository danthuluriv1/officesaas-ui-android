import axiosClient from './axiosClient';
import type { ApiResponse, Order, PaginatedResponse, Party, Product, Quotation } from '../types';

export const OrderService = {
  getOrders: async (pageNumber = 1, pageSize = 50) => {
    const res = await axiosClient.get<ApiResponse<PaginatedResponse<Order> | Order[]>>('/Billing/orders', {
      params: { pageNumber, pageSize },
    });
    const payload = res.data?.data;
    if (payload && 'items' in payload) return payload.items;
    return Array.isArray(payload) ? payload : [];
  },

  createOrder: async (orderPayload: any) => {
    return await axiosClient.post('/Billing/orders', orderPayload);
  },

  updateOrder: async (id: string, orderPayload: any) => {
    return await axiosClient.put(`/Billing/orders/${id}`, orderPayload);
  },

  getParties: async (type: 'Client' | 'Vendor') => {
    const endpoint = type === 'Client' ? '/Clients' : '/Vendors';
    const res = await axiosClient.get<ApiResponse<PaginatedResponse<Party> | Party[]>>(endpoint, { params: { pageSize: 50 } });
    const payload = res.data?.data;
    if (payload && 'items' in payload) return payload.items;
    return Array.isArray(payload) ? payload : [];
  },

  getProducts: async () => {
    const res = await axiosClient.get<ApiResponse<PaginatedResponse<Product> | Product[]>>('/Products', { params: { pageSize: 100 } });
    const payload = res.data?.data;
    if (payload && 'items' in payload) return payload.items;
    return Array.isArray(payload) ? payload : [];
  },

  getApprovedQuotations: async (clientId: string) => {
    const res = await axiosClient.get<ApiResponse<PaginatedResponse<Quotation> | Quotation[]>>(`/Clients/${clientId}/quotations`);
    const payload = res.data?.data;
    let items: Quotation[] = [];
    if (payload && 'items' in payload) items = payload.items;
    else if (Array.isArray(payload)) items = payload;
    return items.filter((q: Quotation) => q.status === 'Approved');
  }
};
