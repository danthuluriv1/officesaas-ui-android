export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface ClientItem {
  id: string;
  name: string;
  type: 'client';
  address: string;
  coordinates?: LocationPoint;
  key: string; // Used for identifying specific stops since a client can be visited multiple times
}

export interface VendorItem {
  id: string;
  name: string;
  type: 'vendor';
  address: string;
  coordinates?: LocationPoint;
  key: string;
}

export interface VehicleItem {
  entityId: string;
  name: string;
  type: string;
  status: string;
}

export interface RouteStop {
  id: string;
  key: string;
}

export interface RoutePlan {
  name: string;
  startTime: string;
  vehicles: string[];
  stops: any[];
}

export interface OptimizationParams {
  serviceBuffer: string;
  driveBuffer: string;
  routeStrategy: 'balanced' | 'fastest' | 'shortest';
}
