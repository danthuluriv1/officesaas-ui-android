import { create } from 'zustand';
import { Route } from '../types/models';

interface RouteStoreState {
  filterDate: string;
  filterStatus: string;
  selectedRoute: Route | null;
  routes: Route[];
  setFilterDate: (date: string) => void;
  setFilterStatus: (status: string) => void;
  setRoutes: (routes: Route[] | ((prev: Route[]) => Route[])) => void;
  setSelectedRoute: (route: Route | null | ((prev: Route | null) => Route | null)) => void;
}

export const useRouteStore = create<RouteStoreState>((set) => ({
  filterDate: new Date().toISOString().split('T')[0],
  filterStatus: 'All',
  selectedRoute: null,
  routes: [],
  setFilterDate: (date) => set({ filterDate: date }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSelectedRoute: (route) => set((state) => ({ 
    selectedRoute: typeof route === 'function' ? route(state.selectedRoute) : route 
  })),
  setRoutes: (routes) => set((state) => ({ 
    routes: typeof routes === 'function' ? routes(state.routes) : routes 
  })),
}));
