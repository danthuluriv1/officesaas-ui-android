import axiosClient from './axiosClient';
import type { StockLevel } from '../types';

export const InventoryService = {
  getStockLevels: async () => {
    const res = await axiosClient.get('/Inventory/stock-levels');
    const pData = res.data?.data || res.data;
    return pData?.items || pData || [];
  },

  addItem: async (payload: any) => {
    return await axiosClient.post('/Inventory', payload);
  },

  adjustStock: async (payload: any) => {
    return await axiosClient.post('/Inventory/ledger', payload);
  }
};
