import { useState, useCallback } from 'react';
import { TransportationService } from '../api/transportationService';
import { ClientService } from '../api/clientService';
import { VendorService } from '../api/vendorService';
import { OfficeService } from '../api/officeService';
import type { Vehicle, FuelPrices } from '../types';
import { useTransportationStore } from '../store/transportationStore';

export interface ClientItem {
  entityId: string;
  companyName: string;
  address: {
    addressLine1: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
}

export function useTransportationData() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [vendors, setVendors] = useState<ClientItem[]>([]);
  const [fuelPrices, setFuelPrices] = useState<FuelPrices>({ petrol: 105, diesel: 95, cng: 85, ev: 8 });
  const [depotCoords, setDepotCoords] = useState({ latitude: 17.4485, longitude: 78.3741, name: 'Office Depot' });

  const setSelectedVehicles = useTransportationStore(state => state.setSelectedVehicles);

  const fetchDetails = async () => {
    try {
      const [vehiclesList, clientsData, vendorsData, fuelData, officeProfile] = await Promise.all([
        TransportationService.getVehicles(),
        ClientService.getClients(1, 100),
        VendorService.getVendors(1, 100),
        TransportationService.getFuelPrices(),
        OfficeService.getProfile().catch(() => null)
      ]);

      setVehicles(vehiclesList);
      
      const parsedClients = (clientsData || []).map((c: any) => ({
        entityId: c.entityId,
        companyName: c.companyName,
        address: c.address || {}
      }));
      setClients(parsedClients);

      const parsedVendors = (vendorsData || []).map((v: any) => ({
        entityId: v.entityId,
        companyName: v.companyName,
        address: v.address || {}
      }));
      setVendors(parsedVendors);

      if (fuelData) {
        setFuelPrices(fuelData);
      }

      if (officeProfile?.address?.latitude && officeProfile?.address?.longitude) {
        setDepotCoords({
          latitude: officeProfile.address.latitude,
          longitude: officeProfile.address.longitude,
          name: officeProfile.name || 'Office Depot'
        });
      }

      // Sync active selections automatically on fetch
      setSelectedVehicles(vehiclesList.filter(v => v.isAvailable).map(v => v.entityId));
      
    } catch (e) {
      console.warn("Fetch Transportation Data Error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetails();
  }, []);

  return {
    loading,
    refreshing,
    vehicles,
    clients,
    vendors,
    fuelPrices,
    depotCoords,
    fetchDetails,
    onRefresh
  };
}
