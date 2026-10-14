import { api } from './api.service'; 
import { Operation, OperationsClientGroup } from '@/types/operation-types';

// ==========================================
// INTERFACES Y PAYLOADS
// ==========================================
export interface GetOperationsParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  date?: string;            // 🚀 Nuevo
  placa?: string;           // 🚀 Nuevo
  numeroPedido?: string;    // 🚀 Nuevo
  containerNumber?: string; // 🚀 Nuevo
  conductor?: string;       // 🚀 Nuevo
}

export interface PaginatedOperations {
  data: OperationsClientGroup[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AmparoSuggestionOperation {
  id: number;
  type: 'EXPORTACION' | 'IMPORTACION';
  status: string;
  numeroPedido?: string | null;
  containerNumber: string | null;
  appointmentAt: string;
  analystId: number | null;
  analyst: { id: number; name: string | null } | null;
  driver: { id: number; name: string | null } | null;
  vehicle: { id: number; plate: string } | null;
  port: { id: number; name: string; isPort: boolean } | null;
}

export interface AmparoSuggestion {
  exportOperation: AmparoSuggestionOperation;
  importOperation: AmparoSuggestionOperation;
}

export interface ConfirmAmparoPayload {
  exportOperationId: number;
  importOperationId: number;
  driverId: number;
  vehicleId: number;
}

export type UpdateOperationPayload = Partial<{
  type: string;
  clientId: number;
  isAnticipada: boolean;
  origenId: number;
  cargueId: number;
  descargueId: number;
  destinoId: number;
  scheduledAt: string;
  driverId: number | null;
  vehicleId: number | null;
  trailerId: number | null;
  fleteCobro: number | null;
  fleteCobroManual: number | null;
  containerNumber: string;
  containerType: string;
  peso: number;
  sealNumber: string;
  pinRetiro: string;
  documentoTransporte: string;
  numeroPedido: string;
  observaciones: string;
  fechaCitaOrigen: string;
  fechaCitaDestino: string;
  fechaRetiro: string;
  fechaLimiteDevolucion: string;
}>;

// ==========================================
// SERVICIO PRINCIPAL UNIFICADO
// ==========================================
export const operationService = {
  getAmparoSuggestions: async (): Promise<AmparoSuggestion[]> => {
    const response = await api.get<AmparoSuggestion[]>('/operations/amparos/suggestions');
    return response.data;
  },

  confirmAmparo: async (payload: ConfirmAmparoPayload) => {
    const response = await api.post('/operations/amparos/confirm', payload);
    return response.data;
  },
  
  // ----------------------------------------
  // MÉTODOS PARA PROGRAMACIÓN (useProgramacion)
  // ----------------------------------------
  
  createOperation: async (operationData: Record<string, unknown>): Promise<Operation> => {
    const response = await api.post<Operation>('/operations', operationData);
    return response.data;
  },

  getOperationsByDate: async (date: string): Promise<Operation[]> => {
    const response = await api.get<Operation[]>(`/operations/by-date?date=${date}`);
    return response.data;
  },

  cancelOperation: async (id: number): Promise<void> => {
    await api.patch(`/operations/${id}/cancel`);
  },

  assignVehicle: async (id: number, vehicleId: number): Promise<Operation> => {
    const response = await api.patch<Operation>(`/operations/${id}/assign-vehicle`, {
      vehicleId,
    });
    return response.data;
  },

  // ----------------------------------------
  // MÉTODOS PARA TRÁFICO (useTrafico)
  // ----------------------------------------

  getActiveOperations: async (params?: GetOperationsParams): Promise<PaginatedOperations> => {
    const response = await api.get<PaginatedOperations>('/operations', { params });
    return response.data;
  },

  getOperationById: async (id: number): Promise<Operation> => {
    const response = await api.get<Operation>(`/operations/${id}`);
    return response.data;
  },

  updateOperation: async (operationId: number, data: UpdateOperationPayload): Promise<Operation> => {
    const response = await api.patch<Operation>(`/operations/${operationId}`, data);
    return response.data;
  },

  setDriverAccess: async (operationId: number, isActive: boolean): Promise<Operation> => {
    const response = await api.patch<Operation>(
      `/operations/${operationId}/driver-access`,
      { isActive },
    );
    return response.data;
  },
};