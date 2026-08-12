import { useQuery } from '@tanstack/react-query';
import { TransportationService } from '../transportationService';

export const useSavedRoutes = (dateStr: string) => {
  return useQuery({
    queryKey: ['savedRoutes', dateStr],
    queryFn: async () => {
      return await TransportationService.getSavedRoutes(dateStr);
    },
    staleTime: 60 * 1000, // 1 minute
  });
};
