import { api } from './api.service'; 
import { Operation } from '@/types/operation-types';
import { CreateOperationInput } from '@/schemas/operation.schema';

export interface GetOperationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
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

export interface AssignOperationPayload {
  driverId: number;
  analystId: number;
}

// NUEVO: Interfaz para la reasignación de emergencia
export interface ReassignOperationPayload {
  driverId: number;
  vehicleId: number;
}

export const operationService = {
  getActiveOperations: async (params?: GetOperationsParams): Promise<PaginatedOperations> => {
    const response = await api.get<PaginatedOperations>('/operations/active', {
      params,
    });
    return response.data;
  },

  getOperationById: async (id: number): Promise<Operation> => {
    const response = await api.get<Operation>(`/operations/${id}`);
    return response.data;
  },

  assignDriver: async (operationId: number, payload: AssignOperationPayload): Promise<void> => {
    await api.put(`/operations/${operationId}/assign`, payload);
  },

  // NUEVO: Método para reasignar conductor y vehículo en ruta
  reassignOperation: async (operationId: number, payload: ReassignOperationPayload): Promise<Operation> => {
    const response = await api.patch<Operation>(`/operations/${operationId}/reassign`, payload);
    return response.data;
  },

  createOperation: async (data: CreateOperationInput): Promise<void> => {
    await api.post('/operations', data);
  },
};