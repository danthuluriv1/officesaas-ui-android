import axiosClient from './axiosClient';
import type { ApiResponse, PaginatedResponse, LedgerEntry } from '../types';

export const FinanceService = {
  getLedger: async (pageNumber = 1, pageSize = 50) => {
    const res = await axiosClient.get<ApiResponse<PaginatedResponse<LedgerEntry> | LedgerEntry[]>>('/Financials/ledger', {
      params: { pageNumber, pageSize },
    });
    const payload = res.data?.data;
    if (payload && 'items' in payload) return payload.items;
    return Array.isArray(payload) ? payload : [];
  },

  createJournalEntry: async (payload: any) => {
    return await axiosClient.post('/Financials/journal-entries', payload);
  },

  createPayment: async (payload: any) => {
    return await axiosClient.post('/Financials/payments', payload);
  }
};
