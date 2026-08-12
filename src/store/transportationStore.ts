import { create } from 'zustand';
import { RouteStop, OptimizationParams } from '../types/transportation';

interface TransportationState {
  // State
  selectedClients: RouteStop[];
  selectedVendors: RouteStop[];
  clientTargetTimes: Record<string, string>;
  vendorTargetTimes: Record<string, string>;
  selectedVehicles: string[];
  planningParams: OptimizationParams;

  // Actions
  setSelectedClients: (clients: RouteStop[] | ((prev: RouteStop[]) => RouteStop[])) => void;
  setSelectedVendors: (vendors: RouteStop[] | ((prev: RouteStop[]) => RouteStop[])) => void;
  setClientTargetTimes: (times: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setVendorTargetTimes: (times: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setSelectedVehicles: (vehicles: string[] | ((prev: string[]) => string[])) => void;
  updatePlanningParams: (params: Partial<OptimizationParams>) => void;
  resetPlanning: () => void;
}

const defaultParams: OptimizationParams = {
  serviceBuffer: '15',
  driveBuffer: '10',
  routeStrategy: 'balanced',
};

export const useTransportationStore = create<TransportationState>((set) => ({
  selectedClients: [],
  selectedVendors: [],
  clientTargetTimes: {},
  vendorTargetTimes: {},
  selectedVehicles: [],
  planningParams: defaultParams,

  setSelectedClients: (clients) => set((state) => ({
    selectedClients: typeof clients === 'function' ? clients(state.selectedClients) : clients
  })),

  setSelectedVendors: (vendors) => set((state) => ({
    selectedVendors: typeof vendors === 'function' ? vendors(state.selectedVendors) : vendors
  })),

  setClientTargetTimes: (times) => set((state) => ({
    clientTargetTimes: typeof times === 'function' ? times(state.clientTargetTimes) : times
  })),

  setVendorTargetTimes: (times) => set((state) => ({
    vendorTargetTimes: typeof times === 'function' ? times(state.vendorTargetTimes) : times
  })),

  setSelectedVehicles: (vehicles) => set((state) => ({
    selectedVehicles: typeof vehicles === 'function' ? vehicles(state.selectedVehicles) : vehicles
  })),

  updatePlanningParams: (params) => set((state) => ({
    planningParams: { ...state.planningParams, ...params }
  })),

  resetPlanning: () => set({
    selectedClients: [],
    selectedVendors: [],
    clientTargetTimes: {},
    vendorTargetTimes: {},
    selectedVehicles: [],
    planningParams: defaultParams,
  }),
}));
