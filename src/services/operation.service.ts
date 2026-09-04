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

  createOperation: async (data: CreateOperationInput): Promise<void> => {
    await api.post('/operations', data);
  },
};