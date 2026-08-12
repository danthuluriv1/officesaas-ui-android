import axiosClient from './axiosClient';
import type { ClientBasic } from '../types';

export const ClientService = {
  getClients: async (pageNumber = 1, pageSize = 50) => {
    const response = await axiosClient.get('/Clients', { params: { pageNumber, pageSize } });
    if (response.data?.isSuccess) {
      return response.data.data.items || response.data.data;
    }
    return response.data || [];
  },

  addClient: async (payload: any) => {
    return await axiosClient.post('/Clients', payload);
  }
};
