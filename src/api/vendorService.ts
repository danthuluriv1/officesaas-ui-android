import axiosClient from './axiosClient';

export const VendorService = {
  getVendors: async (pageNumber = 1, pageSize = 50) => {
    const response = await axiosClient.get('/Vendors', { params: { pageNumber, pageSize } });
    if (response.data?.isSuccess) {
      return response.data.data.items || response.data.data;
    }
    return response.data || [];
  },

  addVendor: async (payload: any) => {
    return await axiosClient.post('/Vendors', payload);
  }
};
