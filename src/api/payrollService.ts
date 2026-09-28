import axiosClient from './axiosClient';
import type { ApiResponse } from '../types';

export const PayrollService = {
  previewPayroll: async (monthKey: string) => {
    const res = await axiosClient.get(`/Payroll/preview/${monthKey}`);
    return res.data;
  },
  
  finalizePayroll: async (monthKey: string) => {
    const res = await axiosClient.post(`/Payroll/calculate/${monthKey}`);
    return res.data;
  },

  getPayrollHistory: async (monthKey: string) => {
    const res = await axiosClient.get(`/Payroll/history/${monthKey}`);
    return res.data;
  },

  getPayrollBatches: async () => {
    const res = await axiosClient.get(`/Payroll/batches`);
    return res.data;
  },

  disburseBatch: async (batchEntityId: string, mode: string, reference: string) => {
    const res = await axiosClient.post(`/Payroll/disburse/${batchEntityId}?mode=${mode}&reference=${reference}`);
    return res.data;
  },

  markPayslipsPaid: async (payslipEntityIds: string[]) => {
    const res = await axiosClient.put(`/Payroll/payslips/mark-paid`, { payslipEntityIds });
    return res.data;
  },

  updateAdvanceDeduction: async (payslipEntityId: string, newAdvanceDeduction: number) => {
    const res = await axiosClient.put(`/Payroll/payslips/${payslipEntityId}/advance-deduction`, { newAdvanceDeduction });
    return res.data;
  },

  getSalaryStructures: async () => {
    const res = await axiosClient.get(`/Payroll/salary-structures`);
    return res.data;
  },
  
  getEmployees: async () => {
    const res = await axiosClient.get(`/Employees`, { params: { pageSize: 100 } });
    return res.data;
  },

  getEmployee: async (id: string) => {
    const res = await axiosClient.get(`/Employees/${id}`);
    return res.data;
  },

  updateEmployee: async (id: string, payload: any) => {
    const res = await axiosClient.put(`/Employees/${id}`, payload);
    return res.data;
  },

  getAdvances: async () => {
    const res = await axiosClient.get(`/Prepayments/active/Employee`, { params: { pageSize: 50 } });
    return res.data;
  },
  
  createAdvance: async (payload: any) => {
    const res = await axiosClient.post(`/Prepayments`, payload);
    return res.data;
  }
};
