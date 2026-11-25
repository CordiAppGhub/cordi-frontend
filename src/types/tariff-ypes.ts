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
  tractorAxles: number | null;
  trailerAxles: number | null;
  requiresTrailer: boolean;
  maxLegalPbvKg: number;
  maxTolerancePbvKg: number;
  approxTareKg: number;
  maxPayloadKg: number | null;
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

export interface SurchargeCatalog {
  code: string;
  name: string;
  basePrice: number;
  description?: string | null;
  applicableTo?: string | null;
}

export interface CreateSurchargeOverrideInput {
  clientId: number;
  surchargeCode: string;
  customPrice: number;
}

export interface ClientSurchargeOverride extends CreateSurchargeOverrideInput {
  id: number;
  client?: { id: number; razonSocial: string };
  surcharge?: SurchargeCatalog;
}

export interface OperationSurcharge {
  id: number;
  operationId: number;
  novedadId: number | null;
  surchargeCode: string;
  appliedPrice: number;
  costPrice: number;
  quantity: number;
  totalPrice: number;
  observations: string | null;
  isPatioCharge: boolean;
  patioLocationId?: number | null;
  patioLocation?: { id: number; name: string } | null;
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