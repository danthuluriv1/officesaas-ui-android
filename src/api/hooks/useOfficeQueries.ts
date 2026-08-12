import { useQuery } from '@tanstack/react-query';
import { OfficeService } from '../officeService';
import { OfficeProfile } from '../officeService';

export const useOfficeProfile = () => {
  return useQuery<OfficeProfile, Error>({
    queryKey: ['officeProfile'],
    queryFn: async () => {
      return await OfficeService.getProfile();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
