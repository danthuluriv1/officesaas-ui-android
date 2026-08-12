import { useQuery } from '@tanstack/react-query';
import { ClientService } from '../clientService';

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      return await ClientService.getClients();
    },
    staleTime: 5 * 60 * 1000,
  });
};
