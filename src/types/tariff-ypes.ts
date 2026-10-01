// ==========================================
// ENUMS
// ==========================================
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

// ==========================================
// 1. TARIFA MAESTRA POR CLIENTE
// ==========================================
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

// ==========================================
// 2. CATÁLOGO DE NOVEDADES
// ==========================================
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

// ==========================================
// 3. RESPUESTAS DEL COTIZADOR
// ==========================================
export interface QuoteResponse {
  type: string;
  price: number;
  tariffId?: number;
}


// Agrega o verifica esto en tu tariff-ypes.ts
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