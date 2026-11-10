export type OperationType = 
  | 'EXPORTACION'
  | 'IMPORTACION'
  | 'RETIRO_VACIO'
  | 'DEVOLUCION_VACIO'
  | 'NACIONAL'
  | 'MOVIMIENTO_INTERNO';

export type ContainerType =
  | 'DRY_20'
  | 'DRY_40'
  | 'HC_40'
  | 'REEFER_20'
  | 'REEFER_40_HC'
  | 'OPEN_TOP_20'
  | 'OPEN_TOP_40'
  | 'FLAT_RACK_20'
  | 'FLAT_RACK_40'
  | 'ISO_TANK_20';
export type RouteScope = 'URBANO' | 'NACIONAL';

export interface CargoVehicleType {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ClientTariff {
  id: number;
  clientId: number;
  operationType: OperationType;
  routeScope: RouteScope | null;
  isContainerized: boolean;
  locationId: number | null;
  price: number;
  client?: { id: number; razonSocial: string };
  location?: { id: number; name: string } | null;
}

export interface CreateClientTariffInput {
  clientId: number;
  operationType: OperationType;
  routeScope: RouteScope;
  isContainerized: boolean;
  locationId: number;
  price: number;
}

export interface PatioTariff {
  id: number;
  clientId: number;
  locationId: number;
  paymentPrice: number;
  billingPrice: number;
  client?: { id: number; razonSocial: string };
  location?: { id: number; name: string };
}

export interface UpsertPatioTariffInput {
  clientId: number;
  locationId: number;
  paymentPrice: number;
  billingPrice: number;
}

export interface SurchargeCatalog {
  id: number;
  code: string;
  name: string;
  basePrice: number;
  isActive: boolean;
  description?: string;
  applicableTo?: string;
}

export interface CreateSurchargeOverrideInput {
  clientId: number;
  surchargeCode: string;
  customPrice: number;
}

export interface QuoteResponse {
  type: string;
  price: number;
  tariffId?: number;
}

export interface ClientQuoteParams {
  clientId: number;
  operationType: string;
  routeScope: RouteScope;
  locationId: number;
  isContainerized?: boolean;
}

export type VehicleAffiliation = 'CORDIVEHICULOS' | 'CORDIHUB' | 'TERCEROS';

export interface AffiliationTariff {
  id: number;
  affiliation: VehicleAffiliation;
  percentage: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAffiliationTariffInput {
  affiliation: VehicleAffiliation;
  percentage: number;
  description?: string;
}