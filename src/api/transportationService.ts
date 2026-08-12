import axiosClient from './axiosClient';
import type { Vehicle, FuelPrices, OptimizeResponse } from '../types';

export const TransportationService = {
  getVehicles: async (): Promise<Vehicle[]> => {
    const res = await axiosClient.get('/Vehicles');
    return res.data.data || [];
  },

  createVehicle: async (vehicle: Omit<Vehicle, 'entityId' | 'isAvailable'>): Promise<Vehicle> => {
    const res = await axiosClient.post('/Vehicles', vehicle);
    return res.data.data;
  },

  updateVehicle: async (id: string, vehicle: Vehicle): Promise<Vehicle> => {
    const res = await axiosClient.put(`/Vehicles/${id}`, vehicle);
    return res.data.data;
  },

  getFuelPrices: async (): Promise<FuelPrices> => {
    const res = await axiosClient.get('/Vehicles/fuel-prices');
    return res.data.data;
  },

  saveFuelPrices: async (prices: FuelPrices): Promise<FuelPrices> => {
    const res = await axiosClient.post('/Vehicles/fuel-prices', prices);
    return res.data.data;
  },

  optimizeRoutes: async (params: {
    activeVehicleEntityIds: string[];
    fuelPrices: FuelPrices;
    clients: { entityId: string; targetTime?: string | null }[];
    vendors: { entityId: string; targetTime?: string | null }[];
    stopBufferMinutes?: number;
  }): Promise<OptimizeResponse> => {
    const res = await axiosClient.post('/Routing/optimize', params);
    return res.data.data;
  },

  saveRoutes: async (routes: any[], routeDate?: string): Promise<boolean> => {
    const mappedRoutes = routes.map(r => ({
      vehicleEntityId: r.vehicleEntityId,
      vehicleName: r.vehicleName,
      driverEntityId: null,
      totalCostINR: r.estimatedCostINR,
      distanceKm: r.distanceKm,
      suggestedStartTime: r.suggestedStartTime,
      stops: r.stops.map((s: any) => ({
        sequenceNumber: s.sequenceNumber,
        stopName: s.stopName,
        latitude: s.latitude,
        longitude: s.longitude,
        addressText: s.addressText,
        targetTime: s.targetTime || null,
        estimatedArrivalTime: s.estimatedArrivalTime || null
      }))
    }));
    const res = await axiosClient.post('/Routing/save', { routes: mappedRoutes, routeDate: routeDate || null });
    return res.data.data;
  },

  getSavedRoutes: async (date?: string, vehicleEntityId?: string, driverEntityId?: string): Promise<any[]> => {
    const res = await axiosClient.get('/Routing/saved', {
      params: { date, vehicleEntityId, driverEntityId }
    });
    return res.data.data || [];
  },

  completeStop: async (routeEntityId: string, sequenceNumber: number, status = 'Completed'): Promise<boolean> => {
    const res = await axiosClient.post('/Routing/stop/complete', {
      routeEntityId,
      sequenceNumber,
      status
    });
    return res.data.data;
  }
};
