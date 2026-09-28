import axiosClient from './axiosClient';
import type { ApiResponse, PaginatedResponse, LedgerEntry, JournalEntryItem } from '../types';

export interface JournalEntriesFilter {
  from?: string | null;
  to?: string | null;
  category?: string;
  paidTo?: string;
  pageNumber?: number;
  pageSize?: number;
}
export interface PaymentsFilter {
  from?: string | null;
  to?: string | null;
  paymentType?: 'ReceivedFromClient' | 'MadeToVendor';
  paidBy?: string;
  mode?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const FinanceService = {
  getLedgerFilters: async () => {
    const response = await axiosClient.get('/Financials/ledger-filters');
    return response.data.data;
  },

  getLedger: async (pageNumber = 1, pageSize = 50, filters?: { startDate?: string, endDate?: string, transactionType?: string }) => {
    const params: any = { pageNumber, pageSize, ...filters };
    const res = await axiosClient.get<ApiResponse<PaginatedResponse<LedgerEntry> | LedgerEntry[]>>('/Financials/ledger', {
      params,
    });
    const payload = res.data?.data;
    if (payload && 'items' in payload) return payload.items;
    return Array.isArray(payload) ? payload : [];
  },

  createJournalEntry: async (payload: any) => {
    return await axiosClient.post('/Financials/journal-entries', payload);
  },

  getJournalEntries: async (filters?: JournalEntriesFilter) => {
    const params: any = {
      pageNumber: filters?.pageNumber ?? 1,
      pageSize: filters?.pageSize ?? 50,
    };
    if (filters?.from) params.from = filters.from;
    if (filters?.to) params.to = filters.to;
    if (filters?.category) params.category = filters.category;
    if (filters?.paidTo) params.paidTo = filters.paidTo;

    const res = await axiosClient.get<ApiResponse<{ items: JournalEntryItem[]; totalCount: number }>>('/Financials/journal-entries', { params });
    return res.data?.data ?? { items: [], totalCount: 0 };
  },

  getPayments: async (filters?: PaymentsFilter) => {
    const params: any = {
      pageNumber: filters?.pageNumber ?? 1,
      pageSize: filters?.pageSize ?? 50,
    };
    if (filters?.from) params.from = filters.from;
    if (filters?.to) params.to = filters.to;
    if (filters?.paymentType) params.paymentType = filters.paymentType;
    if (filters?.paidBy) params.paidBy = filters.paidBy;
    if (filters?.mode) params.mode = filters.mode;

    const res = await axiosClient.get('/Financials/payments', { params });
    return res.data?.data ?? { items: [], totalCount: 0 };
  },

  createPayment: async (payload: any) => {
    return await axiosClient.post('/Financials/payments', payload);
  }
};





