import {
  CargoVehicleType,
  ClientQuoteParams,
  ClientSurchargeOverride,
  ClientTariff,
  CreateClientTariffInput,
  CreateSurchargeOverrideInput,
  OperationSurcharge,
  QuoteResponse,
  SurchargeCatalog,
  AffiliationTariff,
} from "@/types/tariff-ypes";
import type { VehicleAffiliation } from "@/types/tariff-ypes";
import { api } from "./api.service";

export interface CreateSurchargeCatalogInput {
  code: string;
  name: string;
  description?: string;
  applicableTo?: string;
  basePrice?: number;
}

export interface CreateAffiliationTariffInput {
  affiliation: VehicleAffiliation;
  percentage: number;
  description?: string;
}

export type UpdateClientTariffInput = Partial<CreateClientTariffInput>;

export interface ApplySurchargeInput {
  operationId: number;
  novedadId?: number;
  surchargeCode: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  observations?: string;
  isPatioCharge?: boolean;
  patioLocationId?: number;
}

export type UpdateOperationSurchargeInput = Partial<
  Pick<
    ApplySurchargeInput,
    | 'novedadId'
    | 'quantity'
    | 'unitPrice'
    | 'costPrice'
    | 'observations'
    | 'isPatioCharge'
    | 'patioLocationId'
  >
>;

export const tariffService = {
  getAllClientTariffs: async (): Promise<ClientTariff[]> => {
    const { data } = await api.get('/tariffs');
    return data;
  },

  getCargoVehicleTypes: async (): Promise<CargoVehicleType[]> => {
    const { data } = await api.get('/tariffs/vehicle-types');
    return data;
  },

  createClientTariff: async (payload: CreateClientTariffInput): Promise<ClientTariff> => {
    const { data } = await api.post('/tariffs', payload);
    return data;
  },

  updateClientTariff: async (id: number, payload: UpdateClientTariffInput): Promise<ClientTariff> => {
    const { data } = await api.patch(`/tariffs/${id}`, payload);
    return data;
  },

  deleteClientTariff: async (id: number): Promise<ClientTariff> => {
    const { data } = await api.delete(`/tariffs/${id}`);
    return data;
  },

  getAllSurcharges: async (): Promise<SurchargeCatalog[]> => {
    const { data } = await api.get('/tariffs/surcharges');
    return data;
  },

  createSurchargeCatalog: async (payload: CreateSurchargeCatalogInput): Promise<SurchargeCatalog> => {
    const { data } = await api.post('/tariffs/surcharges', payload);
    return data;
  },

  updateSurchargeCatalog: async (
    code: string,
    payload: Partial<Omit<CreateSurchargeCatalogInput, 'code'>>,
  ): Promise<SurchargeCatalog> => {
    const { data } = await api.patch(`/tariffs/surcharges/${encodeURIComponent(code)}`, payload);
    return data;
  },

  deleteSurchargeCatalog: async (code: string): Promise<SurchargeCatalog> => {
    const { data } = await api.delete(`/tariffs/surcharges/${encodeURIComponent(code)}`);
    return data;
  },

  getAllSurchargeOverrides: async (): Promise<ClientSurchargeOverride[]> => {
    const { data } = await api.get('/tariffs/surcharges/overrides');
    return data;
  },

  createSurchargeOverride: async (payload: CreateSurchargeOverrideInput): Promise<ClientSurchargeOverride> => {
    const { data } = await api.post('/tariffs/surcharges/overrides', payload);
    return data;
  },

  updateSurchargeOverride: async (
    id: number,
    payload: Partial<CreateSurchargeOverrideInput>,
  ): Promise<ClientSurchargeOverride> => {
    const { data } = await api.patch(`/tariffs/surcharges/overrides/${id}`, payload);
    return data;
  },

  deleteSurchargeOverride: async (id: number): Promise<ClientSurchargeOverride> => {
    const { data } = await api.delete(`/tariffs/surcharges/overrides/${id}`);
    return data;
  },

  getAllVehicleTariffs: async (): Promise<AffiliationTariff[]> => {
    const { data } = await api.get('/tariffs/affiliation');
    return data;
  },

  upsertVehicleTariff: async (payload: CreateAffiliationTariffInput): Promise<AffiliationTariff> => {
    const { data } = await api.post('/tariffs/affiliation', payload);
    return data;
  },

  updateVehicleTariff: async (
    id: number,
    payload: Partial<CreateAffiliationTariffInput>,
  ): Promise<AffiliationTariff> => {
    const { data } = await api.patch(`/tariffs/affiliation/${id}`, payload);
    return data;
  },

  deleteVehicleTariff: async (id: number): Promise<AffiliationTariff> => {
    const { data } = await api.delete(`/tariffs/affiliation/${id}`);
    return data;
  },

  getQuote: async (params: ClientQuoteParams): Promise<QuoteResponse> => {
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

  getOperationSurcharges: async (operationId: number): Promise<OperationSurcharge[]> => {
    const { data } = await api.get(`/tariffs/operation-surcharges/${operationId}`);
    return data;
  },

  applySurchargeToOperation: async (payload: ApplySurchargeInput): Promise<OperationSurcharge> => {
    const { data } = await api.post('/tariffs/operation-surcharges', payload);
    return data;
  },

  updateOperationSurcharge: async (
    id: number,
    payload: UpdateOperationSurchargeInput,
  ): Promise<OperationSurcharge> => {
    const { data } = await api.patch(`/tariffs/operation-surcharges/${id}`, payload);
    return data;
  },

  deleteOperationSurcharge: async (id: number): Promise<OperationSurcharge> => {
    const { data } = await api.delete(`/tariffs/operation-surcharges/${id}`);
    return data;
  },
};