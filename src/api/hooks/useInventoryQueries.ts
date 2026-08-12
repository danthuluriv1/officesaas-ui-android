import { useQuery } from '@tanstack/react-query';
import { InventoryService } from '../inventoryService';

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      return await InventoryService.getStockLevels();
    },
    staleTime: 60 * 1000,
  });
};
