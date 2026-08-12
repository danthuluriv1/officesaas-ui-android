import axiosClient from './axiosClient';

export interface OfficeAddress {
  addressLine1: string;
  addressLine2: string;
  village: string;
  mandal: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface BankAccount {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  isActive: boolean;
}

export interface OfficeProfile {
  name: string;
  email: string;
  phone: string;
  companyDomain?: string;
  address: OfficeAddress;
  gstin: string;
  cin: string;
  pan: string;
  epfNumber: string;
  esiNumber: string;
  logoBase64: string;
  brandColors: string[];
  departments: string[];
  designations: string[];
  bankAccounts: BankAccount[];
}

export const OfficeService = {
  getProfile: async (): Promise<OfficeProfile> => {
    const response = await axiosClient.get('/Settings/profile');
    if (response.data?.isSuccess) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to load office profile');
  },

  updateProfile: async (payload: OfficeProfile): Promise<OfficeProfile> => {
    const response = await axiosClient.put('/Settings/profile', payload);
    if (response.data?.isSuccess) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to update office profile');
  },
};
