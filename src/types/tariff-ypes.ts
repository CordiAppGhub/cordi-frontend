export type OperationType = 
  | 'EXPORTACION'
  | 'IMPORTACION'
  | 'RETIRO_VACIO'
  | 'DEVOLUCION'
  | 'INGRESO_EXPORTACION'
  | 'RETIRO_IMPORTACION'
  | 'DESVIO'
  | 'INSPECCION';

export type ContainerType = 'DRY_20' | 'DRY_40' | 'HC_40' | 'REEFER_20' | 'REEFER_40' | 'FLAT_RACK' | 'OPEN_TOP';

export interface ClientTariff {
  id: number;
  clientId: number;
  operationType: OperationType;
  isAnticipada: boolean;
  locationId?: number | null;
  price: number;
  client?: { id: number; razonSocial: string };
  location?: { id: number; name: string };
}

export interface CreateClientTariffInput {
  clientId: number;
  operationType: OperationType;
  isAnticipada?: boolean;
  locationId?: number;
  price: number;
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