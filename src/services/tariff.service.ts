import { ClientTariff, CreateClientTariffInput, SurchargeCatalog, CreateSurchargeOverrideInput, QuoteResponse, AffiliationTariff } from "@/types/tariff-ypes";
import { api } from "./api.service";

export interface CreateSurchargeCatalogInput {
  code: string;
  name: string;
  description?: string;
  applicableTo?: string;
  basePrice: number;
}

// 🚀 NUEVO: Interfaces para Tarifas de Flotas
export interface CreateAffiliationTariffInput {
  affiliation: string;
  percentage: number;
  description?: string;
}


export const tariffService = {
  // ==========================================
  // TARIFA MAESTRA POR CLIENTE
  // ==========================================
  getAllClientTariffs: async (): Promise<ClientTariff[]> => {
    const { data } = await api.get('/tariffs');
    return data;
  },

  createClientTariff: async (payload: CreateClientTariffInput): Promise<ClientTariff> => {
    const { data } = await api.post('/tariffs', payload);
    return data;
  },

  // ==========================================
  // CATÁLOGO DE NOVEDADES Y EXCEPCIONES
  // ==========================================
  getAllSurcharges: async (): Promise<SurchargeCatalog[]> => {
    const { data } = await api.get('/tariffs/surcharges');
    return data;
  },

  createSurchargeCatalog: async (payload: CreateSurchargeCatalogInput): Promise<SurchargeCatalog> => {
    const { data } = await api.post('/tariffs/surcharges', payload);
    return data;
  },

  createSurchargeOverride: async (payload: CreateSurchargeOverrideInput) => {
    const { data } = await api.post('/tariffs/surcharges/overrides', payload);
    return data;
  },

  // ==========================================
  // 🚀 NUEVO: TARIFAS DE VEHÍCULOS (FLOTAS)
  // ==========================================
  getAllVehicleTariffs: async (): Promise<AffiliationTariff[]> => {
    const { data } = await api.get('/tariffs/affiliation');
    return data;
  },

  upsertVehicleTariff: async (payload: CreateAffiliationTariffInput): Promise<AffiliationTariff> => {
    const { data } = await api.post('/tariffs/affiliation', payload);
    return data;
  },

  // ==========================================
  // MOTOR DE COTIZACIÓN AUTOMÁTICA
  // ==========================================
  getQuote: async (params: { 
    clientId: number; 
    operationType: string; 
    isAnticipada: boolean; 
    locationId?: number 
  }): Promise<QuoteResponse> => {
    const { data } = await api.get('/tariffs/quote', { params });
    return data;
  },

  getSurchargeQuote: async (params: { 
    clientId: number; 
    surchargeCode: string 
  }) => {
    const { data } = await api.get('/tariffs/surcharges/quote', { params });
    return data;
  },

  // ==========================================
  // RECARGOS EN OPERACIONES ACTIVAS
  // ==========================================
  applySurchargeToOperation: async (payload: { 
    operationId: number; 
    surchargeCode: string; 
    quantity: number; 
    observations?: string;
  }) => {
    const { data } = await api.post('/tariffs/operation-surcharges', payload);
    return data;
  },
};