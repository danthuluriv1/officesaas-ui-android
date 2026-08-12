export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
}

export interface ProductSummary {
  entityId: string;
  name: string;
  sku: string;
  category: string;
  sellingPrice: number;
}

export interface BomRow {
  inventoryItemEntityId: string;
  quantityConsumed: number;
}

export interface StockLevel {
  entityId: string;
  name: string;
  unitOfMeasure: string;
  quantityOnHand: number;
  unitPrice?: number;
}

export interface AttendanceRecordDto {
  employeeEntityId: string;
  employeeName: string;
  employeeCode: string;
  status: 0 | 1 | 2 | 3 | 4 | null;
  shiftStartTime: string | null;
  shiftEndTime: string | null;
  isLogged: boolean;
}

export interface DailyAttendanceDashboardResponse {
  dateString: string;
  totalHeadcount: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  records: {
    items: AttendanceRecordDto[];
  };
}

export interface ClientBasic {
  entityId: string;
  companyName: string;
  email?: string;
  phone?: string;
  contactPerson1?: string;
  gstin?: string;
}

export interface VendorBasic {
  entityId: string;
  companyName: string;
  email?: string;
  phone?: string;
  contactPerson1?: string;
  gstin?: string;
}

export interface Party {
  entityId: string;
  companyName: string;
}

export interface LineItem {
  name?: string;
  description: string;
  hsN_SAC_Code?: string;
  quantity: number;
  rate: number;
  taxPercentage: number;
}

export interface OrderBasic {
  entityId: string;
  orderNumber: string;
  totalGrandAmount: number;
  associatedPartyEntityId?: string | null;
}

export interface Order {
  entityId: string;
  orderNumber: string;
  startDate: string;
  totalGrandAmount: number;
  status: string;
  associatedPartyEntityId?: string | null;
  items?: LineItem[];
}

export interface QuotationItem {
  name?: string;
  description: string;
  hsN_SAC_Code?: string;
  quantity: number;
  rate: number;
  taxPercentage: number;
}

export interface Quotation {
  entityId: string;
  quotationNumber: string;
  status: string;
  items: QuotationItem[];
}

export interface Product {
  entityId: string;
  name: string;
  sku: string;
  sellingPrice: number;
  description?: string;
}

export interface LedgerEntry {
  entityId: string;
  postingDate: string;
  description: string;
  type: 'Credit' | 'Debit' | string;
  amount: number;
}

export interface Vehicle {
  entityId: string;
  name: string;
  licensePlate: string;
  mileagePerLiter: number;
  fuelType: string;
  isAvailable: boolean;
  currentOdometerKm?: number;
}

export interface FuelPrices {
  petrol: number;
  diesel: number;
  cng: number;
  ev: number;
}

export interface RouteStop {
  sequenceNumber: number;
  stopName: string;
  latitude: number;
  longitude: number;
  addressText: string;
  targetTime?: string;
  estimatedArrivalTime?: string;
}

export interface VehicleRoute {
  vehicleEntityId: string;
  vehicleName: string;
  estimatedCostINR: number;
  distanceKm: number;
  suggestedStartTime?: string;
  stops: RouteStop[];
}

export interface OptimizeResponse {
  totalCostINR: number;
  totalDistanceKm: number;
  routes: VehicleRoute[];
}

