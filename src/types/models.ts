export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  latitude?: number;
  longitude?: number;
}

export interface RouteStop {
  entityId: string;
  status: string;
  latitude: number;
  longitude: number;
  name?: string;
}

export interface Route {
  entityId: string;
  vehicleName: string;
  distanceKm: number;
  suggestedStartTime?: string;
  stops: RouteStop[];
}

export interface OfficeProfile {
  name: string;
  companyDomain?: string;
  address: Address;
  compliance?: {
    gstin?: string;
    pan?: string;
  };
}
