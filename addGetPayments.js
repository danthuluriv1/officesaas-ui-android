const fs = require("fs");
let text = fs.readFileSync("src/api/financeService.ts", "utf-8");

// Add PaymentsFilter interface after JournalEntriesFilter
const insertAfter = `export interface JournalEntriesFilter {
  from?: string | null;
  to?: string | null;
  category?: string;
  paidTo?: string;
  pageNumber?: number;
  pageSize?: number;
}`;

const newInterface = `
export interface PaymentsFilter {
  from?: string | null;
  to?: string | null;
  paymentType?: 'ReceivedFromClient' | 'MadeToVendor';
  paidBy?: string;
  mode?: string;
  pageNumber?: number;
  pageSize?: number;
}`;

text = text.replace(insertAfter, insertAfter + newInterface);

// Add getPayments method before createPayment
text = text.replace(
  `  createPayment: async (payload: any) => {`,
  `  getPayments: async (filters?: PaymentsFilter) => {
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

  createPayment: async (payload: any) => {`
);

fs.writeFileSync("src/api/financeService.ts", text, "utf-8");
console.log("Frontend updated");
