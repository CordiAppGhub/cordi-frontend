export type OperationType = 
  | 'EXPORTACION'
  | 'IMPORTACION'
  | 'RETIRO_VACIO'
  | 'DEVOLUCION'
  | 'INGRESO_EXPORTACION'
  | 'RETIRO_IMPORTACION'
  | 'INSPECCION'
  | 'NACIONAL'
  | 'CARGA_SUELTA_URBANA'
  | 'CARGA_SUELTA_NACIONAL'
  | 'MOVIMIENTO_INTERNO';

export type ContainerType = 'DRY_20' | 'DRY_40' | 'HC_40' | 'REEFER_40' | 'FLAT_RACK' | 'OPEN_TOP';
export type CargoFormat = 'CONTENERIZADA' | 'SUELTA';

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
  isAnticipada: boolean;
  cargoFormat: CargoFormat;
  originLocationId?: number | null;
  destinationLocationId?: number | null;
  originLocation?: { id: number; name: string } | null;
  destinationLocation?: { id: number; name: string } | null;
  containerSize?: ContainerType | null;
  vehicleTypeId?: number | null;
  vehicleType?: CargoVehicleType | null;
  locationId?: number | null;
  price: number;
  client?: { id: number; razonSocial: string };
  location?: { id: number; name: string };
}

interface CreateClientTariffBase {
  clientId: number;
  operationType: OperationType;
  isAnticipada?: boolean;
  cargoFormat: CargoFormat;
  originLocationId: number;
  destinationLocationId: number;
  price: number;
}

export type CreateClientTariffInput = CreateClientTariffBase &
  (
    | { cargoFormat: 'CONTENERIZADA'; containerSize: ContainerType; vehicleTypeId?: never }
    | { cargoFormat: 'SUELTA'; vehicleTypeId: number; containerSize?: never }
  );

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
  isAnticipada: boolean;
  cargoFormat: CargoFormat;
  originLocationId: number;
  destinationLocationId: number;
  containerSize?: ContainerType;
  vehicleTypeId?: number;
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