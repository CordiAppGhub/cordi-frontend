import { api } from './api.service'; 
import { Operation } from '@/types/operation-types'; // Asegúrate de que esta interfaz tenga los nuevos campos (trailerId, status actualizados)

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
  data: Operation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type UpdateOperationPayload = Partial<{
  driverId: number | null;
  vehicleId: number | null;
  trailerId: number | null;
  fleteCobroManual: number | null;
  containerNumber: string;
  containerType: string;
  peso: number;
  sealNumber: string;
  pinRetiro: string;
  documentoTransporte: string;
}>;

// ==========================================
// SERVICIO PRINCIPAL UNIFICADO
// ==========================================
export const operationService = {
  
  // ----------------------------------------
  // MÉTODOS PARA PROGRAMACIÓN (useProgramacion)
  // ----------------------------------------
  
  createOperation: async (operationData: any): Promise<Operation> => {
    const response = await api.post<Operation>('/operations', operationData);
    return response.data;
  },

  getOperationsByDate: async (date: string): Promise<Operation[]> => {
    try {
      const response = await api.get<Operation[]>(`/operations/by-date?date=${date}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return [];
      throw error;
    }
  },

  cancelOperation: async (id: number): Promise<void> => {
    await api.patch(`/operations/${id}/cancel`);
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
  }
};