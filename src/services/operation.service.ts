import { api } from './api.service'; 
import { Operation } from '@/types/operation-types';
import { CreateOperationFormData } from '@/schemas/operation.schema';

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
  vehicleId: number;
  fletePagoManual?: number;
}

export interface ReassignOperationPayload {
  driverId: number;
  vehicleId: number;
  fletePagoManual?: number;
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

  reassignOperation: async (operationId: number, payload: ReassignOperationPayload): Promise<Operation> => {
    const response = await api.patch<Operation>(`/operations/${operationId}/reassign`, payload);
    return response.data;
  },

  createOperation: async (data: CreateOperationFormData): Promise<void> => {
    await api.post('/operations', data);
  },
};