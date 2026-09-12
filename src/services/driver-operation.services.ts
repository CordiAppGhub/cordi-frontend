import { DriverOperation, UpdateMicroStateDto } from '@/types/driver-operation-types';
import { api } from './api.service';

export const driverOperationService = {
  getAssignedOperation: async (token: string): Promise<DriverOperation> => {
    const response = await api.get<DriverOperation>('/driver-portal/operation', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },


  updateMicroState: async (token: string, dto: UpdateMicroStateDto): Promise<DriverOperation> => {
    const response = await api.patch<DriverOperation>('/driver-portal/operation/state', dto, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};