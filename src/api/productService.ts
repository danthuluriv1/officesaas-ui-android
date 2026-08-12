import axiosClient from './axiosClient';

export const ProductService = {
  getProducts: async (pageNumber = 1, pageSize = 50, searchTerm = '') => {
    const response = await axiosClient.get('/Products', { params: { pageNumber, pageSize, searchTerm } });
    const pData = response.data?.data || response.data;
    return pData?.items || pData || [];
  },

  addProduct: async (payload: any) => {
    return await axiosClient.post('/Products', payload);
  }
};
