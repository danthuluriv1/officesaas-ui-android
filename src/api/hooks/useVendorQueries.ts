import { useQuery } from '@tanstack/react-query';
import { VendorService } from '../vendorService';

export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      return await VendorService.getVendors();
    },
    staleTime: 5 * 60 * 1000,
  });
};
